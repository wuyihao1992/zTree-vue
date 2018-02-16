<!--
  <z-tree
    ref="xxs"
    @node-check="treeNodeCheck"
    @node-click="treeNodeClick"
    @node-expand="treeNodeExpend"
    :treeNode="treeNode"
    :treeSetting="treeSetting"
    :show-checkbox="true"
    :check-strictly="true"
  />

  弃用:
  @check-change="checkChange"
  @current-change="currentChange"
-->
<template>
  <div class="treeWrap">
    <ul class="ztree" :id="id"></ul>
  </div>
</template>
<script>
  import './js/jquery.ztree.core.min'
  import './js/jquery.ztree.excheck.min'

  let deepAssign = require('deep-assign')

  export default {
    name: 'zTree',
    components: {},
    data() {
      return {
        id: '',
        treeObj: null
      }
    },
    props: {
      treeSetting: {type: Object, default: null},     // treeSetting
      treeNode: {type: Array, default: null},         // data
      showCheckbox: {type: Boolean, default: false},  // :show-checkbox，是否显示选择框，默认为 false 不显示
      checkStrictly: {type: Boolean, default: false}  // :check-strictly，在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 false
    },
    methods: {
      /**
       * TODO：组件创建时处理id
       */
      createId() {
        let random = (Math.random()).toString()
        let id = new Date().getTime() + random.substring(3, random.length - 1)
        this.id = id
      },

      /**
       * 创建树
       */
      initTree() {
        let defaultSetting = {
          view: {
            showLine: false                            // 不显示虚线
          },
          check: {
            enable: this.showCheckbox,
            chkboxType: this.checkStrictly ? {"Y": "", "N": ""} : {"Y": "ps", "N": "ps" }
          },
          callback: {
            onClick: (e, treeId, treeNode) => {
              this.onClick(treeNode)
              // this.currentChange(treeNode)             // 此方法等同onClick，（重复）可删除

              this.treeObj.expandNode(treeNode)        // TODO: 手动绑定点击文字展开操作
              this.onExpand(e, treeId, treeNode)
            },
            onCheck: (e, treeId, treeNode) => {
              let checkedNodes = this.treeObj.getCheckedNodes(true)
              this.onCheck(treeNode, checkedNodes)
              // this.checkChange(treeNode, checkedNodes)  // 此方法等同onCheck，（重复）可删除
            },
            onExpand: this.onExpand,
            onCollapse: this.onCollapse,
            beforeAsync: (treeId, treeNode) => {},
            onAsyncSuccess: this.onAsyncSuccess
          },
          async: {
            enable: false,
            contentType: "application/json;charset=UTF-8",
            dataType: 'json',
            url: '',
            autoParam: ["id=bizId"],
            otherParam: {},
            dataFilter: this.ajaxDataFilter
          },
          data: {
            simpleData : {
              enable: true,
              idKey: "id",                              // id编号命名
              pIdKey: "pId",                            // 父id编号命名
              // rootId: 0
            }
          }
        };

        defaultSetting = deepAssign(defaultSetting, this.treeSetting)

        this.treeObj = $.fn.zTree.init($('#' + this.id), defaultSetting, this.treeNode || []);
      },

      /**
       * 节点被点击时的回调
       * @param node
       */
      onClick(node) {
        this.$emit('node-click', node)
      },
      /**
       * 节点被选中时的回调
       * @param node
       * @param checkedNodes
       */
      onCheck(node, checkedNodes) {
        this.$emit('node-check', node, checkedNodes)
      },
      /**
       * 节点选中状态发生变化时的回调
       * @param node 当前勾选节点
       * @param checkedNodes 选中的节点
       *
       */
      checkChange(node, checkedNodes) {
        this.$emit('check-change', node, checkedNodes)
      },
      /**
       * 当前选中节点变化时触发的事件
       * @param node 选中的节点
       */
      currentChange(node) {
        this.$emit('current-change', node)
      },
      /**
       * 节点展开触发, 回调函数会传入两个参数，{treeNode: 当前点击的节点，this.treeObj：zTree对象}
       * @param e
       * @param treeId
       * @param treeNode
       */
      onExpand(e, treeId, treeNode) {
        this.$emit('node-expand', treeNode, this.treeObj)
      },
      /**
       * 节点折叠触发
       * @param e
       * @param treeId
       * @param treeNode
       */
      onCollapse(e, treeId, treeNode) {
        this.$emit('node-collapse', treeNode)
      },
      onAsyncSuccess(e, treeId, treeNode, msg) {
        console.log('success')
      },

      /**
       * TODO:获取zTree对象
       * @returns {null}
       */
      getZTree() {
        return this.treeObj
      },
      /**
       * 返回根节点或集合
       * @param isSingle 是否单个节点，默认多个节点集合；单个节点：{}||null, 集合：[]
       */
      getRoots(isSingle = true) {
        return this.treeObj.getNodesByFilter(function (node) {
          return node.level == 0
        }, isSingle)
      },
      /**
       * 获取 zTree 的全部节点数据
       * @returns {*}
       */
      getNodes() {
        return this.treeObj.getNodes()
      },
      /**
       * 获取 zTree 当前被选中的节点数据集合
       * @returns {*}
       */
      getCurrentNode() {
        return this.treeObj.getSelectedNodes()
      },
      /**
       * 获取输入框被勾选 或 未勾选的节点集合
       * @param checked Boole, {true: 勾选中，false：未勾选中}。默认选择勾选中的节点
       * @returns {*}
       */
      getCheckedNodes(checked = true) {
        return this.treeObj.getCheckedNodes(checked)
      },

      /**
       * 刷新树(尽量少用)
       */
      refresh() {
        this.treeObj.refresh()
      },
      updateNode(node, options = {}) {
        // 更新某节点数据，主要用于该节点显示属性的更新
        node = Object.assign(node, options)
        this.treeObj.updateNode(node);
      },

      /**
       * 勾选 或 取消勾选 单个节点。[setting.check.enable = true 时有效]
       * @param treeNode 需要勾选 或 取消勾选 的节点数据
       * @param checked checked = true 表示勾选节点;checked = false 表示节点取消勾选
       * @param checkTypeFlag checkTypeFlag = true 表示按照 setting.check.chkboxType 属性进行父子节点的勾选联动操作;checkTypeFlag = false 表示只修改此节点勾选状态，无任何勾选联动操作
       * @param callbackFlag callbackFlag = true 表示执行此方法时触发 beforeCheck & onCheck 事件回调函数;callbackFlag = false 表示执行此方法时不触发事件回调函数
       */
      checkNode(treeNode, checked = true, checkTypeFlag = true, callbackFlag = false) {
        if (treeNode) {
          this.treeObj.checkNode(treeNode, checked, checkTypeFlag, callbackFlag)
        }
      },
      /**
       * 勾选 或 取消勾选 多个节点。[setting.check.enable = true 时有效]
       * @param nodes 需要选中的节点数组。
       * 此方法类似选中单个节点（checkNode方法），默认选中且父子关联，如需修改此选项应在 nodes[i] 里面新增checkedFlag，与checkTypeFlag属性
       */
      checkNodes(nodes = []) {
        if (nodes.length > 0) {
          nodes.forEach((item, i) => {
            this.treeObj.checkNode(item, item.checkedFlag || true, item.checkTypeFlag || true)
          })
        }
      },

      /**
       * TODO：封装同级单选功能，给父组件调用，配合checkStrictly:true使用
       * @param node 当前勾选节点
       * @param checkedNodes
       */
      singleLevelSelect(node, checkedNodes) {
        if (this.checkStrictly) {
          checkedNodes.forEach((item, index) => {
            if (item.id !== node.id) {
              item.checked = false
              this.treeObj.updateNode(item)

              checkedNodes.splice(index, 1)     // 删除其余节点，可能会有隐藏bug。通过 getCheckedNodes() 方法获取的选中节点可能包含删除的节点
            }
          })
        }

        return node
      },
      singleSelectTest(node, checkedNodes) {
        if (!node) {
          return
        }

        let unCheckNode = (node) => {
          node.checked = false
          this.treeObj.updateNode(node)

          if (node.children && node.children.length > 0) {
            for (let item of node.children) {
              unCheckNode(item)
            }
          }
        }

        if (node.children && node.children.length > 0) {

        } else {
          // 叶子节点

        }

        for (let item of checkedNodes) {
          if (item.id !== node.id) {
            if (item.grade === node.grade) {
              // 统一层级，取消勾选
              console.log(item)
              unCheckNode(item)
            }
          }
        }
      },

      /**
       * ajax Filter (暂时无用)
       * @param treeId
       * @param parentNode
       * @param responseData
       * @returns {*}
       */
      ajaxDataFilter(treeId, parentNode, responseData) {
        return this.formParentData(responseData)
      },
      formParentData(result) {
        if (result.exceptionCode === 0) {
          let data = result.bizContent
          if (data.length > 0) {
            return data
          } else {
            return []
          }
        } else {
          return []
        }
      }

    },
    created() {
      this.createId()
    },
    mounted() {
      this.initTree()
    }
  }
</script>
<style lang="stylus" scoped>
  @import "./css/metroStyle/metroStyle.css"
  @import "./css/demo.css"
</style>
