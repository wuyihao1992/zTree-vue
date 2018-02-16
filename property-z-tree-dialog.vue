<!--
  选择资产树的弹窗 propertyZTreeDialog
  ！！！默认多选，父子无级联
  <property-z-tree-dialog
      ref="propertyZTreeDialogRef"
      :isShow="isShow"
      :default-biz-id="addcurrentNode.bizId"
      :isSingleChecked="true"
      @on-close="showmatername=false"
      @on-commit="onTreeCommit"
    ></property-z-tree-dialog>
-->
<template>
  <div>
    <el-dialog
      title="资产树"
      :visible="isShow"
      :before-close="handleClose"
      custom-class="propertyZTreeDialog">

      <div class="ZTreeDialogWrap">
        <property-z-tree
          ref="propertyTreeDialog"
          @node-check="proOnCheck"
          :treeProps="treeProps"
          :max-grade="maxGrade"
          :default-biz-id="defaultBizId"
          :initChecked="initChecked"
        ></property-z-tree>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleCommit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
  import propertyZTree from '@/common/widget/zTree/property-z-tree'

  export default {
    name: 'propertyZTreeDialog',
    components: {propertyZTree},
    props: {
      isShow: {type: Boolean, default: false},
      treeProps: {
        type: Object,
        default: function () {
          return {showCheckbox: true, checkStrictly: true}  // 默认父子无关联
        }
      },
      maxGrade: {type: Number, default: 8},
      defaultBizId: {                                     // 默认父节点
        validator: function(value) {
          return true
        }
      },
      initChecked: {type: Array, default: null},          // 默认选中节点
      isSingleChecked: {type: Boolean, default: false}    // TODO: 是否单选，默认 false ！！！
    },
    data() {
      return {
        checkedNode: null
      }
    },
    methods: {
      proOnCheck(node, checkedNodes) {
        if (this.isSingleChecked) {
          this.checkedNode = this.$refs.propertyTreeDialog.singleLevelSelect(node, checkedNodes)  // 单选节点
        } else {
          this.checkedNode = checkedNodes
        }
      },

      /**
       * 格式化返回选中的数据及房产名,给父组件调用。返回房产对象数组和房产名称
       * @returns {{materialIdArr: Array, materialName: string}}
       */
      formatterCheckedNode() {
        return this.$refs.propertyTreeDialog.formatterMaterial(this.checkedNode)
      },
      // 获取叶子节点
      formatterChecked(isLeaf) {
        return this.$refs.propertyTreeDialog.formatterChecked(this.checkedNode, isLeaf)
      },

      handleClose() {
        this.$emit('on-close');
      },
      handleCommit() {
        this.$emit('on-commit', this.checkedNode)
      }
    },
    mounted() {}
  }
</script>
<style lang="stylus">
  .propertyZTreeDialog {
    width: 400px;
    height: 460px;

    .ZTreeDialogWrap {
      height 320px;
    }
  }
</style>
