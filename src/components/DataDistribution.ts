import {defineComponent, markRaw, PropType} from 'vue';
import {degEulerToQuaternion} from '../utils/quaternion';

export default defineComponent({
    props: {
        width: Number,
        height: Number,
        data: Array as PropType<{ rx: number, ry: number, rz: number }[]>
    },
    data() {
        return {
            ctx: null as CanvasRenderingContext2D | null,
        };
    },
    mounted() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        this.ctx = markRaw(canvas.getContext('2d')!);
        this.render();
    },
    watch: {
        data() {
            this.render();
        }
    },
    methods: {
        render() {
            const ctx = this.ctx;
            if (!ctx) {
                return;
            }
            const width = this.width!;
            const height = this.height!;
            ctx.fillStyle = '#f2f2f2';
            ctx.fillRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.strokeStyle = '#999';
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.fillText('front', width - 28, cy + 3);
            ctx.fillText('back', 6, cy + 3);
            ctx.fillText('up', cx - 6, 12);
            ctx.fillText('down', cx - 12, height - 6);
            const size = width / 2 * .75;
            this.data?.forEach(item => {
                const quaternion = degEulerToQuaternion(item.rx + 180, item.ry + 180, item.rz + 180);
                ctx.beginPath();
                ctx.arc(
                    cx + (1 - Math.abs(quaternion.z) * 2) * size,
                    cy + quaternion.y * size,
                    1,
                    0,
                    Math.PI * 2
                );
                ctx.strokeStyle = '#000';
                ctx.stroke();
            });
        }
    }
});
