import {execFileSync} from 'node:child_process';
import {existsSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
    console.error('dist/ não existe. Rode "npm run build" antes.');
    process.exit(1);
}

// URL do remote origin (resolvida na raiz do projeto)
const origin = execFileSync('git', ['config', '--get', 'remote.origin.url'], {cwd: root})
    .toString().trim();
if (!origin) {
    console.error('Remote "origin" não encontrado.');
    process.exit(1);
}

const git = (...args) => execFileSync('git', args, {cwd: dist, stdio: 'inherit'});

console.log(`Publicando dist/ em gh-pages de ${origin} ...`);

// Repositório git temporário e isolado dentro de dist/
rmSync(resolve(dist, '.git'), {recursive: true, force: true});
git('init', '-q');
git('checkout', '-q', '-b', 'gh-pages');
git('add', '-A');
git('-c', 'user.name=deploy', '-c', 'user.email=deploy@local',
    'commit', '-q', '-m', 'Deploy to GitHub Pages');
git('push', '-q', '-f', origin, 'gh-pages');
rmSync(resolve(dist, '.git'), {recursive: true, force: true});

console.log('✓ Deploy concluído → branch gh-pages.');
