<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script lang="ts">
import {message} from 'ant-design-vue';
import {defineComponent} from 'vue';

export default defineComponent({
    mounted(): void {
        window.addEventListener('error', this.onError);
        window.addEventListener('unhandledrejection', this.onUnhandledRejection);
        this.$.appContext.config.errorHandler = this.vueErrorHandler;
    },
    beforeUnmount(): void {
        window.removeEventListener('error', this.onError);
        window.removeEventListener('unhandledrejection', this.onUnhandledRejection);
        this.$.appContext.config.errorHandler = undefined;
    },
    methods: {
        onError(e: ErrorEvent) {
            this.showErrorMessage(e.error);
        },
        onUnhandledRejection(e: PromiseRejectionEvent) {
            this.showErrorMessage(e.reason);
        },
        vueErrorHandler(err: unknown) {
            this.showErrorMessage(err);
        },
        showErrorMessage(error: any) {
            console.error(error);
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error(error + '');
            }
        }
    }
});
</script>

<style>
html {
    width: 100%;
    height: 100%;
}

body {
    width: 100%;
    height: 100%;
    margin: 0;
}

#app {
    width: 100%;
    height: 100%;
    font-size: 14px;
    font-family: arial, sans-serif;
}
</style>
