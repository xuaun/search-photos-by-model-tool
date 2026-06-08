<template>
    <div class="wrapper">
        <div class="column condition" :class="{collapsed: collapseSearchConditions}">
            <div class="inner-wrapper">
                <div class="row" style="margin-bottom: 8px">
                    <a-spin :spinning="loading" style="flex: 1 1; min-width: 0;">
                        <a-button type="primary" block @click="search">Search</a-button>
                    </a-spin>
                </div>

                <h4>Filters: (optional)</h4>
                <div class="row" style="margin-bottom: 8px; flex-wrap: wrap;">
                    <div v-for="facet in facets"
                         :key="facet.key"
                         style="flex: 1 1 30%; min-width: 90px; margin-bottom: 4px;">
                        <a-select style="width: 100%;"
                                  :placeholder="facet.label"
                                  show-search
                                  allow-clear
                                  v-model:value="filters[facet.key]">
                            <a-select-option v-for="option in facet.options" :key="option" :value="option">{{ option }}</a-select-option>
                        </a-select>
                    </div>
                </div>

                <h4>Direction:</h4>
                <model-viewer :model-url="model.url"
                              v-model:rotateX="model.rotateX"
                              v-model:rotateY="model.rotateY"
                              v-model:rotateZ="model.rotateZ"
                              v-model:zoom="model.zoom"
                              :width="modelViewerSize"
                              :height="modelViewerSize"
                              :gizmo="model.gizmo"
                >
                    <a style="position: absolute; right: 8px; top: 8px; line-height: 14px;"
                       target="_blank" title="Author of this model"
                       v-if="modelAuthorLink"
                       :href="modelAuthorLink">
                        <info-circle-outlined/>
                    </a>
                </model-viewer>

                <div class="row">
                    <a-checkbox v-model:checked="model.gizmo">Gizmo</a-checkbox>
                    <span>X: {{ model.rotateX }}; Y: {{ model.rotateY }}; Z: </span>
                    <a-slider :included="false"
                              v-model:value="model.rotateZ"
                              :min="-180"
                              :max="180"
                              style="flex: 1 1; min-width: 0;"
                    />
                    <div>
                        <span style="width: 2.5em; text-align: center; display: inline-block;">{{
                                model.rotateZ
                            }}</span>
                        <a-button @click="model.rotateX = model.rotateY = model.rotateZ = 0"
                                  size="small"
                        >
                            Reset
                        </a-button>
                    </div>
                </div>

                <div class="info" style="color: #bfbfbf">
                    <div>Author: x6udpngx</div>
                    <div>
                        Special Thanks: <a href="https://github.com/xrabohrok" target="_blank">xrabohrok</a>
                        - Thank you for helping improve this tool!
                    </div>
                    <div>Latest update: 2026-06-08 (human pose search version by Xuaun)</div>
                    <div>
                        Faces from the
                        <a href="https://github.com/joojunfff/fairface" target="_blank">FairFace</a>
                        dataset (CC BY 4.0).
                    </div>
                    <div>
                        <a href="https://github.com/x6ud/x6ud.github.io/issues" target="_blank">Leave a message</a>
                    </div>
                    <div>
                        <a href="https://github.com/x6ud/search-photos-by-model-tool" target="_blank">Source code</a>
                    </div>
                    <div>
                        <span>Support me:</span>
                        <a href="https://ko-fi.com/x6udpngx" target="_blank">
                            <span style="vertical-align: middle;">Ko-fi.com/x6udpngx</span>
                        </a>
                    </div>
                </div>
            </div>

            <div class="collapse-handler" @click="collapseSearchConditions = !collapseSearchConditions">
                <up-outlined class="icon"/>
            </div>
        </div>

        <div class="column result">
            <div class="list">
                <image-thumb class="item"
                             v-for="item in result"
                             :image="item"
                             :key="item.url"
                             :size="200"
                             @click.native="show(item)"
                />
            </div>
        </div>

        <image-viewer v-model:show="large.show"
                      :image-url="large.imageUrl"
                      :flip="large.flip"
                      :id="large.id"
                      :author="large.author"
                      :source="large.source"
        />
    </div>
</template>

<script lang="ts" src="./Search.ts"></script>

<style lang="scss" scoped>
.wrapper {
    display: flex;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10px;

    .column {
        display: flex;
        flex-direction: column;

        &:not(:last-child) {
            margin-right: 10px;
        }

        .row {
            display: flex;
            width: 100%;
            align-items: center;

            &:not(:last-child) {
                margin-bottom: .5em;
            }

            & > * {
                &:not(:last-child) {
                    min-width: 0;
                    margin-right: .5em;
                }
            }
        }
    }

    .column.condition {
        flex: 0 0 360px;
        width: 360px;

        .inner-wrapper {
            display: flex;
            flex-direction: column;
            flex: 1 1;
            min-height: 0;
            width: 100%;
        }

        .collapse-handler {
            display: none;
        }
    }

    .column.result {
        flex: 1 1;
        min-width: 0;
        height: 100%;

        .list {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            box-sizing: border-box;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            padding: 10px;

            .item {
                margin: 5px;
                cursor: zoom-in;
            }
        }
    }
}

@media screen and (max-width: 480px) {
    .wrapper {
        display: block !important;
        overflow: hidden;
        position: relative;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 0 !important;

        .column.condition {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            background-color: #fff;
            overflow: auto;
            transition: height .3s;

            .inner-wrapper {
                width: 360px;
                margin: 0 auto;
                padding: 10px 0;
            }

            .collapse-handler {
                display: block !important;
                position: fixed;
                left: 50%;
                top: 100%;
                width: 48px;
                height: 48px;
                margin: 24px 0 0 24px;
                border-radius: 100%;
                overflow: hidden;
                background-color: rgba(0, 0, 0, 0.2);
                color: #fff;
                font-size: 20px;
                text-align: center;

                .icon {
                    width: 48px;
                }
            }

            &.collapsed {
                height: 0 !important;

                .collapse-handler {
                    top: 0 !important;

                    .icon {
                        transform-origin: 50% 50%;
                        transform: rotate(180deg);
                        margin-top: 24px;
                    }
                }
            }
        }

        .column.result {
        }
    }
}
</style>
