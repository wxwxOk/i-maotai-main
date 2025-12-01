// pages/accounts/list.js
const mtApi = require('../../services/mt');

Page({
  data: {
    accounts: [],
    loading: true
  },

  onShow() {
    this.loadAccounts();
  },

  async loadAccounts() {
    try {
      this.setData({ loading: true });
      const res = await mtApi.getAccounts();
      this.setData({
        accounts: res.accounts || [],
        loading: false
      });
    } catch (error) {
      console.error('加载账号失败', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/accounts/detail?id=${id}`
    });
  },

  goAdd() {
    wx.navigateTo({
      url: '/pages/accounts/add'
    });
  },

  onPullDownRefresh() {
    this.loadAccounts().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
