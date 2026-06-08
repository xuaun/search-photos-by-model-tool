<template>
    <div class="thumb" :style="{width: size + 'px', height: size + 'px'}">
        <div class="img-layer" :class="{flip: image && image.flip}">
            <img v-if="image && image.url" :style="imgStyle" :src="image.url" alt="">
        </div>
        <slot/>
    </div>
</template>

<script lang="ts" src="./ImageThumb.ts"></script>

<style lang="scss" scoped>
.thumb {
    position: relative;
    background-color: #f2f2f2;
    overflow: hidden;

    .img-layer {
        position: absolute;
        inset: 0;

        &.flip {
            transform: scale(-1, 1);
            transform-origin: 50% 50%;
        }

        img {
            position: absolute;
        }
    }
}
</style>
