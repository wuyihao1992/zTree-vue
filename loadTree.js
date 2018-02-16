"use strict";

import {post as post} from '@/api/api';
import * as path from '@/api/api-path';

export const DEFAULT_PROPS = {
  /**
   * 加载子节点
   * @param treeNode 点击的节点
   * @param maxGrade
   * @param treeObj
   * @param maxChkDisabled 最大可选中层级
   * @param showPlate 是否显示车辆节点
   */
  propertyTree(treeNode, maxGrade, treeObj, maxChkDisabled, showPlate) {
    if (!!treeNode) {
      if (treeNode.hasChild == 'true') {
        if (!!treeNode.isParent && !treeNode.children) {
          post(path.getPropertyTree, {bizId: treeNode.bizId}).then(result => {
            let arr = [{children: []}];

            if (result.exceptionCode == 0) {
              let data = result.bizContent;
              if (data.length > 0) {
                arr = this.formNode(data, maxGrade, maxChkDisabled);

                // 如果需要显示车牌号，需要手动写死一个数据
                if (!!showPlate) {
                  if (treeNode.grade == 4) {
                    arr[0].children.unshift({
                      id: `${treeNode.id}_1`,
                      bizId: `-${treeNode.bizId}`,
                      _isPlate: true,
                      name: '车牌',
                      isParent: false
                    });
                  }
                }
              }
            }

            treeObj.addNodes(treeNode, arr[0].children || []);
          });
        }
      }
    } else {
      // 初始化
    }
  },
  /**
   * 处理后台返回的数据，转换成zTree的格式
   * @param data
   * @param maxGrade 最大层级
   * @param maxChkDisabled 最大可选中节点
   * @returns {*}
   */
  formNode(data, maxGrade = 8, maxChkDisabled) {
    data.forEach((item, i) => {
      // 是否可选中
      if (!!maxChkDisabled) {
        if (parseInt(item.grade) < maxChkDisabled) {
          item.chkDisabled = true;
        }
      }

      if (item.grade > maxGrade) {
        data.splice(i, 1);
      } else {
        if (item.grade == maxGrade) {
          item.isParent = false;
          item.children = [];
        } else {
          if (item.hasChild == 'true') {
            item.isParent = true;

            if (item.children.length <= 0) {
              delete item.children;
            } else {
              this.formNode(item.children, maxGrade, maxChkDisabled);
            }
          } else {
            item.isParent = false;
          }
        }
      }
    });

    return data;
  },
  /**
   * 格式化选中的子节点或叶子节点, 可以增加功能
   * @param nodes 选中的节点数组
   * @param isLeaf 是否为叶子节点，{true: 只返回叶子节点，false: 返回叶子节点或跟节点}，默认为true
   * @returns {Array}
   */
  formatterChecked(nodes, isLeaf = true) {
    let checkedNodes = [];

    if (isLeaf) {
      for (let node of nodes) {
        if (!node.children || node.children.length <= 0) {
          checkedNodes.push(node);
        }
      }
    }

    return checkedNodes;
  },
  /**
   * 格式化返回选中的数据及房产名。返回 material 对象
   * @returns {{materialIdArr: Array, materialName: string}}
   */
  formatterMaterial(checkedNode) {
    let materialIdArr = [];
    let materialName = '';

    if (!checkedNode) {
      materialIdArr = [];
    } else {
      if (Object.prototype.toString.call(checkedNode) === '[object Array]') {
        checkedNode.forEach((item, i) => {
          materialIdArr.push({
            bizId: item.bizId,
            code: item.code,
            grade: item.grade,
            materialId: '',
            materialType: ''
          });

          materialName += `${i === 0 ? '' : ', '}${item.name}`;
        });
      } else {
        materialIdArr.push({
          bizId: checkedNode.bizId,
          code: checkedNode.code,
          grade: checkedNode.grade,
          materialId: '',
          materialType: ''
        });

        materialName = checkedNode.name;
      }
    }

    return {
      materialIdArr: materialIdArr,
      materialName: materialName
    }
  }
};

export default DEFAULT_PROPS;
