import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import {
    CloseOutlined,
    DeleteOutlined,
    FileOutlined,
    InfoCircleOutlined,
    LeftOutlined,
    LockOutlined,
    RightOutlined,
    SaveOutlined,
    UpOutlined,
} from '@ant-design/icons-vue';
import {createApp} from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(router);
app.use(Antd);

// Icons used across templates (registered globally with kebab-case names).
app.component('CloseOutlined', CloseOutlined);
app.component('DeleteOutlined', DeleteOutlined);
app.component('FileOutlined', FileOutlined);
app.component('InfoCircleOutlined', InfoCircleOutlined);
app.component('LeftOutlined', LeftOutlined);
app.component('LockOutlined', LockOutlined);
app.component('RightOutlined', RightOutlined);
app.component('SaveOutlined', SaveOutlined);
app.component('UpOutlined', UpOutlined);

app.mount('#app');
