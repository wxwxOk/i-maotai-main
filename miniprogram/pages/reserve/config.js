// pages/reserve/config.js
const mtApi = require('../../services/mt');

Page({
  data: {
    id: '',
    items: [],
    selectedItems: [],
    config: {
      shopType: 1,
      reserveMinute: 9,
      randomMinute: 0,
      autoTravel: 1
    },
    minuteOptions: Array.from({ length: 31 }, (_, i) => i.toString().padStart(2, '0')),
    minuteIndex: 9,
    saving: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadData();
  },

  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 并行加载商品列表和配置
      const [itemsRes, configRes] = await Promise.all([
        mtApi.getItems(),
        mtApi.getConfig(this.data.id)
      ]);

      const items = itemsRes.items || [];
      const config = configRes || {};

      // 解析已选商品
      const selectedItems = config.itemCodes ? config.itemCodes.split('@') : [];

      this.setData({
        items,
        selectedItems,
        config: {
          shopType: config.shopType || 1,
          reserveMinute: config.reserveMinute || 9,
          randomMinute: config.randomMinute || 0,
          autoTravel: config.autoTravel || 1
        },
        minuteIndex: config.reserveMinute || 9
      });

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 切换商品选择
  toggleItem(e) {
    const itemId = e.currentTarget.dataset.id;
    let selectedItems = [...this.data.selectedItems];

    if (selectedItems.includes(itemId)) {
      selectedItems = selectedItems.filter(id => id !== itemId);
    } else {
      if (selectedItems.length >= 3) {
        wx.showToast({ title: '最多选择3个商品', icon: 'none' });
        return;
      }
      selectedItems.push(itemId);
    }

    this.setData({ selectedItems });
  },

  // 门店类型变更
  onShopTypeChange(e) {
    this.setData({
      'config.shopType': parseInt(e.detail.value)
    });
  },

  // 预约分钟变更
  onMinuteChange(e) {
    const minute = parseInt(e.detail.value);
    this.setData({
      'config.reserveMinute': minute,
      minuteIndex: minute
    });
  },

  // 随机分钟变更
  onRandomChange(e) {
    this.setData({
      'config.randomMinute': e.detail.value ? 0 : 1
    });
  },

  // 自动旅行变更
  onTravelChange(e) {
    this.setData({
      'config.autoTravel': e.detail.value ? 1 : 0
    });
  },

  // 保存配置
  async saveConfig() {
    if (this.data.selectedItems.length === 0) {
      wx.showToast({ title: '请选择预约商品', icon: 'none' });
      return;
    }

    try {
      this.setData({ saving: true });

      await mtApi.updateConfig(this.data.id, {
        itemCodes: this.data.selectedItems.join('@'),
        shopType: this.data.config.shopType,
        reserveMinute: this.data.config.reserveMinute,
        randomMinute: this.data.config.randomMinute,
        autoTravel: this.data.config.autoTravel
      });

      this.setData({ saving: false });
      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
