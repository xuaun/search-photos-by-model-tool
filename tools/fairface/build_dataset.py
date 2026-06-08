import os
import json
import math
import shutil
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from datasets import load_dataset
from PIL import ImageOps, ImageStat

# Caminhos do projeto (resolvidos a partir da localização deste arquivo,
# então funciona não importa de qual pasta você rode o script).
BASE_DIR = os.path.dirname(os.path.abspath(__file__))             # tools/fairface
PROJETO_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))  # raiz do repo

# Modelo do FaceLandmarker (Tasks API). Baixe com:
#   curl -L -o face_landmarker.task \
#     https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
MODELO_TASK = os.path.join(BASE_DIR, "face_landmarker.task")

# Onde as imagens serão salvas (servidas pelo site em /static/...)
PASTA_STATIC = os.path.join(PROJETO_DIR, "static", "human-photos")
# Prefixo de URL usado no JSON (mesmo estilo de models.ts: "./static/...")
URL_PREFIX = "./static/human-photos"
# Saída lida pelo app (src/data.ts importa este arquivo)
SAIDA_JSON = os.path.join(PROJETO_DIR, "src", "data", "human.json")

# --- Configuração do MediaPipe FaceLandmarker (Tasks API) ---
# Diferente do FaceMesh + solvePnP, esta API entrega a MATRIZ DE
# TRANSFORMAÇÃO FACIAL (rotação 3D da cabeça) diretamente e de forma muito
# mais robusta, inclusive em rostos de perfil.
_opcoes = mp_vision.FaceLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=MODELO_TASK),
    running_mode=mp_vision.RunningMode.IMAGE,
    num_faces=1,
    output_facial_transformation_matrixes=True,
    # Limiares mais baixos para recuperar rostos de perfil/baixa luz.
    min_face_detection_confidence=0.3,
    min_face_presence_confidence=0.3,
)
landmarker = mp_vision.FaceLandmarker.create_from_options(_opcoes)

# --- Calibração da pose ---
# Se, ao testar, o casamento de pose ficar espelhado num eixo em relação ao
# crânio 3D do site, troque o sinal aqui (1 ou -1).
FLIP_RX = 1   # pitch (cima/baixo)
FLIP_RY = 1   # yaw (esquerda/direita)
FLIP_RZ = 1   # roll (inclinação)

# Brilho mínimo (0-255) da imagem após auto-contraste; abaixo disso a foto
# é escura demais para servir de referência e é descartada.
LIMIAR_BRILHO = 50

# Recorte: margem ao redor do rosto (1.0 = rosto justo; maior = mais cabeça).
PADDING_RECORTE = 1.7
# Sobe o recorte um pouco, já que a malha facial não cobre o topo da
# cabeça/cabelo (0 = centrado no rosto; 0.15 = sobe 15% do tamanho).
VIES_VERTICAL = 0.15

# --- Mapeamento das categorias do FairFace para o vocabulário de src/facets.ts ---
MAPA_ETNIA = {
    "East Asian": "East Asian",
    "Southeast Asian": "Southeast Asian",
    "Indian": "South Asian",
    "Black": "African",
    "White": "European",
    "Middle Eastern": "Middle Eastern",
    "Latino_Hispanic": "Latino / Hispanic",
}

MAPA_SEXO = {
    "Male": "male",
    "Female": "female",
}

MAPA_IDADE = {
    "0-2": "child",
    "3-9": "child",
    "10-19": "teen",
    "20-29": "young-adult",
    "30-39": "adult",
    "40-49": "adult",
    "50-59": "adult",
    "60-69": "senior",
    "more than 70": "senior",
}


def _wrap180(a):
    """Normaliza um ângulo para o intervalo [-180, 180]."""
    return (a + 180.0) % 360.0 - 180.0


def _trazer_para_90(a):
    """
    Traz o ângulo para [-90, 90] assumindo retrato em pé (proteção extra
    contra leituras impossíveis, ex.: roll perto de ±180).
    """
    a = _wrap180(a)
    if a > 90:
        a -= 180
    elif a < -90:
        a += 180
    return a


def matriz_para_euler_xyz(R):
    """
    Extrai ângulos de Euler (em graus) na ordem XYZ — a mesma convenção do
    Three.js (Object3D.rotation) usada pelo crânio 3D do site.
    """
    R = np.asarray(R, dtype=np.float64)
    m02 = max(-1.0, min(1.0, R[0, 2]))
    ry = math.asin(m02)
    if abs(m02) < 0.9999999:
        rx = math.atan2(-R[1, 2], R[2, 2])
        rz = math.atan2(-R[0, 1], R[0, 0])
    else:
        # Caso degenerado (gimbal lock)
        rx = math.atan2(R[2, 1], R[1, 1])
        rz = 0.0
    return math.degrees(rx), math.degrees(ry), math.degrees(rz)


def normalizar_angulos(rx, ry, rz):
    """Aplica intervalo de retrato em pé e os flips de calibração."""
    rx = _trazer_para_90(rx) * FLIP_RX
    ry = _wrap180(ry) * FLIP_RY
    rz = _trazer_para_90(rz) * FLIP_RZ
    return round(rx, 2), round(ry, 2), round(rz, 2)


def rotulo_para_texto(dataset, exemplo, coluna):
    """
    Os campos race/gender/age do FairFace são inteiros (ClassLabel).
    Converte o índice para o texto correspondente (ou usa direto se já vier
    como string).
    """
    valor = exemplo[coluna]
    if isinstance(valor, int):
        return dataset.features[coluna].int2str(valor)
    return valor


def calcular_angulos_headpose(matriz_4x4):
    """
    Recebe a matriz de transformação facial 4x4 do FaceLandmarker e devolve
    pitch (rx), yaw (ry) e roll (rz) na convenção do crânio 3D do site.
    """
    R = np.asarray(matriz_4x4, dtype=np.float64)[:3, :3]
    rx, ry, rz = matriz_para_euler_xyz(R)
    return normalizar_angulos(rx, ry, rz)


def calcular_bounding_box(landmarks, h, w):
    """
    landmarks: lista de NormalizedLandmark (result.face_landmarks[0]).
    Retorna (cx, cy, cs): canto esquerdo, canto superior e lado do quadrado.
    """
    x_coords = [lm.x * w for lm in landmarks]
    y_coords = [lm.y * h for lm in landmarks]

    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)

    largura = x_max - x_min
    altura = y_max - y_min

    # Centro do rosto, com leve viés para cima (inclui testa/cabelo).
    centro_x = (x_min + x_max) / 2
    centro_y = (y_min + y_max) / 2

    # Quadrado com margem; nunca maior que a própria imagem.
    cs = int(max(largura, altura) * PADDING_RECORTE)
    cs = min(cs, w, h)

    centro_y -= cs * VIES_VERTICAL

    cx = int(centro_x - cs / 2)
    cy = int(centro_y - cs / 2)

    # Trava o quadrado inteiramente dentro da imagem.
    cx = max(0, min(cx, w - cs))
    cy = max(0, min(cy, h - cs))

    return cx, cy, cs


def processar_dataset(limite=5):

    # Limpa a pasta antes de começar, removendo imagens órfãs de execuções
    # anteriores (caso o número de rostos detectados mude).
    if os.path.isdir(PASTA_STATIC):
        shutil.rmtree(PASTA_STATIC)
    os.makedirs(PASTA_STATIC, exist_ok=True)

    print("Baixando dataset...")

    # FairFace tem duas configs de padding: "0.25" (recorte justo no rosto)
    # e "1.25" (mais margem, mostra mais da cabeça). Usamos 1.25 por dar
    # mais contexto de cabeça para referência de pose.
    dataset = load_dataset(
        "HuggingFaceM4/FairFace",
        "1.25",
        split="train",
        streaming=True
    )

    # Embaralha antes de pegar, senão sempre viriam os mesmos primeiros
    # exemplos do dataset. buffer_size = tamanho do "balde" de embaralhamento.
    dataset = dataset.shuffle(seed=42, buffer_size=2000)

    resultados_json = []

    for i, exemplo in enumerate(dataset.take(limite)):

        try:

            pil_image = exemplo["image"]

            # Converte os rótulos inteiros do FairFace em texto
            etnia_raw = rotulo_para_texto(dataset, exemplo, "race")
            sexo_raw = rotulo_para_texto(dataset, exemplo, "gender")
            idade_raw = rotulo_para_texto(dataset, exemplo, "age")

            # Mapeia para o vocabulário usado nos filtros do site
            etnia = MAPA_ETNIA.get(etnia_raw, etnia_raw)
            sexo = MAPA_SEXO.get(sexo_raw, str(sexo_raw).lower())
            idade = MAPA_IDADE.get(idade_raw, idade_raw)

            # Auto-contraste: clareia/normaliza a foto (ajuda detecção e
            # exibição), depois descarta as que ainda ficam escuras demais.
            img_rgb = ImageOps.autocontrast(pil_image.convert("RGB"), cutoff=1)
            brilho = ImageStat.Stat(img_rgb.convert("L")).mean[0]
            if brilho < LIMIAR_BRILHO:
                print(f"Imagem {i}: escura demais (brilho {brilho:.0f}), pulando")
                continue

            # Imagem RGB uint8 (H, W, 3) para o MediaPipe
            rgb = np.array(img_rgb, dtype=np.uint8)
            h_img, w_img = rgb.shape[:2]

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            resultado = landmarker.detect(mp_image)

            if not resultado.face_landmarks or not resultado.facial_transformation_matrixes:
                print(f"Imagem {i}: rosto não encontrado")
                continue

            landmarks = resultado.face_landmarks[0]
            matriz = resultado.facial_transformation_matrixes[0]

            # Só agora (com rosto confirmado) salvamos a imagem, para não
            # deixar arquivos órfãos das fotos sem rosto detectado.
            indice = len(resultados_json)
            caminho_fisico = os.path.join(PASTA_STATIC, f"foto_{indice}.jpg")
            url_imagem = f"{URL_PREFIX}/foto_{indice}.jpg"
            img_rgb.save(caminho_fisico)

            rx, ry, rz = calcular_angulos_headpose(matriz)
            cx, cy, cs = calcular_bounding_box(landmarks, h_img, w_img)

            dado = {
                "rx": rx,
                "ry": ry,
                "rz": rz,
                "url": url_imagem,
                "cx": cx,
                "cy": cy,
                "cs": cs,
                "w": w_img,
                "h": h_img,
                "tags": ["human"],
                "ethnicity": etnia,
                "sex": sexo,
                "age": idade
            }

            resultados_json.append(dado)

            print(
                f"Imagem {i} processada "
                f"(pitch={rx}, yaw={ry}, roll={rz}) "
                f"[{etnia}, {sexo}, {idade}]"
            )

        except Exception as ex:
            print(f"Erro na imagem {i}: {ex}")

    with open(SAIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(resultados_json, f, indent=2, ensure_ascii=False)

    print(f"{SAIDA_JSON} salvo com {len(resultados_json)} registros.")


if __name__ == "__main__":
    processar_dataset(limite=10000)
