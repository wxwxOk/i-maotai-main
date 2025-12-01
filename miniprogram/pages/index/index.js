// pages/index/index.js
const mtApi = require('../../services/mt');

Page({
  data: {
    today: '',
    accounts: [],
    loading: true
  },

  onLoad() {
    this.setData({
      today: this.formatDate(new Date())
    });
  },

  onShow() {
    this.loadTodayStatus();
  },

  // 加载今日状态
  async loadTodayStatus() {
    try {
      this.setData({ loading: true });
      const res = await mtApi.getTodayStatus();

      const accounts = res.accounts.map(account => ({
        ...account,
        mobileMask: this.maskMobile(account.mobile),
        statusText: this.getStatusText(account.status),
        items: account.items.map(item => ({
          ...item,
          statusText: this.getItemStatusText(item.status)
        }))
      }));

      this.setData({ accounts, loading: false });
    } catch (error) {
      console.error('加载失败', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 手机号脱敏
  maskMobile(mobile) {
    if (!mobile) return '';
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  // 获取状态文本
  getStatusText(status) {
    const map = {
      'success': '已预约',
      'pending': '待预约',
      'failed': '预约失败'
    };
    return map[status] || '未知';
  },

  // 获取商品状态文本
  getItemStatusText(status) {
    const map = {
      0: '预约中',
      1: '已预约',
      2: '预约失败',
      3: '已中签',
      4: '未中签'
    };
    return map[status] || '未知';
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 跳转添加账号
  goAddAccount() {
    wx.navigateTo({
      url: '/pages/accounts/add'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadTodayStatus().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
