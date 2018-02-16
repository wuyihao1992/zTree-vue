<!--
  <property-z-tree @node-click="proOnClick" @node-check="proOnCheck" :treeProps="{showCheckbox: true}" :max-grade="4"></property-z-tree>

  <property-z-tree class="content-left" v-splitter @node-click="handleNodeClick" :max-grade="4"></property-z-tree>

  1. 页面调用 property-z-tree 的方法使用 this.$refs.xxx.test(), 'xxx' 为 property-z-tree 的 ref 值
  2. property-z-tree 调用 z-tree 的方法使用 this.$refs.proZTree.xxx()
-->
<template>
  <z-tree
    v-if="treeNode"
    ref="proZTree"
    :treeNode="treeNode"
    @node-check="innerOnCheck"
    @node-click="innerOnClick"
    @check-change="innerCheckChange"
    @current-change="innerCurrentChange"
    @node-expand="innerOnExpend"
    :treeSetting="innerProps.treeSetting"
    :show-checkbox="innerProps.showCheckbox"
    :check-strictly="innerProps.checkStrictly"
  ></z-tree>
  <div v-else-if="loading" v-loading="loading" element-loading-text="加载中..." class="wh"></div>
  <div v-else class="emptyWrap">
    <span class="empty__text">暂无数据</span>
  </div>
</template>
<script>
  import zTree from './z-tree'
  import loadTree from './loadTree'
  import {post} from '@/api/api'
  import * as path from '@/api/api-path'

  let deepAssign = require('deep-assign')

  export default {
    name: 'property-z-tree',
    components: {zTree},
    data() {
      return {
        treeObj: null,
        treeNode: null,
        innerProps: {
          treeSetting: {},
          showCheckbox: false,
          checkStrictly: false
        },

        loading: false
      }
    },
    props: {
      treeProps: {type: Object, default: null},     // 树的配置（具体看 z-tree.vue）
      maxGrade: {type: Number, default: 8},         // 最大层数
      maxChkDisabled: {type: Number, default: 0},   // 最大可选中节点
      showPlate: {type: Boolean, default: false},   // 是否显示车辆节点
      defaultBizId: {                               // 默认父节点
        validator: function(value) {
          return true
        }
      },
      initChecked: {type: Array, default: null}     // 默认选中节点
    },
    methods: {
      /**
       * 加载根节点
       */
      initTree() {
        this.loading = true

        this.innerProps = deepAssign(this.innerProps, this.treeProps)

        let param = !!this.defaultBizId ? {bizId: this.defaultBizId} : {}
        post(path.getPropertyTree, param).then(result => {
          this.loading = false

          if (result.exceptionCode === 0) {
            let data = result.bizContent
            data = loadTree.formNode(data, this.maxGrade, this.maxChkDisabled)

            this.treeNode = data
          }

          param = null
        }).catch(err => {
          this.loading = false
        })
      },
      /**
       * 初始化选中默认节点，在数据返回成功后调用
       */
      initCheckNodes() {
        if (!this.initChecked) {
          return
        }

        this.toCheckNodes(this.initChecked)
      },

      innerOnClick(node) {
        this.$emit('node-click', node)
      },
      innerOnCheck(node, checkedNodes) {
        this.$emit('node-check', node, checkedNodes)
      },
      innerCheckChange(node, checkedNodes) {
        this.$emit('check-change', node, checkedNodes)
      },
      innerCurrentChange(node) {
        this.$emit('current-change', node)
      },
      innerOnExpend(node, treeObj) {
        loadTree.propertyTree(node, this.maxGrade, treeObj, this.maxChkDisabled, this.showPlate)
        this.$emit('node-expand', node, treeObj)
      },

      getZTree() {
        return this.$refs.proZTree.getZTree()
      },
      getRoots(isSingle) {
        return this.$refs.proZTree.getRoots(isSingle)
      },
      getCurrentNode() {
        return this.getZTree().getCurrentNode()
      },
      getCheckedNodes(checked = true) {
        return this.getZTree().getCheckedNodes(checked)
      },

      toCheckNode(treeNode, checked, checkTypeFlag, callbackFlag) {
        this.$refs.proZTree.checkNode(treeNode, checked, checkTypeFlag, callbackFlag)
      },
      /**
       * 选中节点
       * @param nodes
       */
      toCheckNodes(nodes) {
        this.$refs.proZTree.checkNodes(nodes)
      },
      /**
       * 更新某个节点（目前只更新了子节点）
       * @param treeNode
       */
      toUpdateNode(treeNode) {
        if (treeNode) {
          this.loading = true

          post(path.getPropertyTree, {bizId: treeNode.bizId}).then(result => {
            this.loading = false

            if (result.exceptionCode === 0) {
              let data = result.bizContent
              data = loadTree.formNode(data, this.maxGrade)

              treeNode.children = data.children
              this.$refs.proZTree.updateNode(treeNode)
            }
          })
        }
      },
      /**
       * 刷新树,获取根节点
       * @param callback 回调,用于加载列表等操作
       */
      toReloadTree(callback = function () {}) {
        this.loading = true
        this.treeNode = null

        post(path.getPropertyTree, {}).then(result => {
          this.loading = false

          if (result.exceptionCode === 0) {
            let data = result.bizContent
            data = loadTree.formNode(data, this.maxGrade, this.maxChkDisabled)

            this.treeNode = data

            callback.call(this, data)
          } else {
            callback.call(this, null)
          }
        })
      },

      /**
       * 格式化选中的子节点或叶子节点
       * @param nodes 选中的节点数组
       * @param isLeaf 是否为叶子节点，{true: 只返回叶子节点，false: 返回叶子节点或跟节点}，默认为true
       * @returns {Array}
       */
      formatterChecked(nodes, isLeaf = true) {
        return loadTree.formatterChecked(nodes, isLeaf)
      },
      /**
       * 格式化返回选中的数据及房产名,给父组件调用。返回房产对象数组和房产名称
       * @returns {{materialIdArr: Array, materialName: string}}
       */
      formatterMaterial(checkedNodes) {
        return loadTree.formatterMaterial(checkedNodes)
      },

      singleLevelSelect(node, checkedNodes) {
        return this.$refs.proZTree.singleLevelSelect(node, checkedNodes)
      },

      test() {
        console.log('页面调用了property-z-tree的test方法')
      }
    },
    mounted() {
      this.initTree()
    }
  }
</script>
<style scoped lang="stylus">
  // property-z-tree 容器border样式
  .propertyZTreeBorder{
    border: 1px solid rgb(209, 229, 229);
    border-left: 0;
    border-radius: 4px;
  }

  .emptyWrap{
    box-sizing: border-box;
    height: 100%;
    overflow: auto;
    color: rgb(31, 60, 61);
  }
  .emptyWrap{
    overflow: hidden;
    position: relative;
  }
  .emptyWrap .empty__text{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
