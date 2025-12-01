// pages/user/index.js
const app = getApp();
const { get } = require('../../utils/request');

Page({
  data: {
    userInfo: {},
    accountCount: 0,
    stats: {
      totalReserve: 0,
      winCount: 0,
      winRate: '0%'
    },
    subscribed: false,
    version: '1.0.0'
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    try {
      const res = await get('/user/info');
      const accountCount = res.accounts?.length || 0;

      this.setData({
        userInfo: res,
        accountCount
      });

      // 加载统计数据
      this.loadStats();
    } catch (error) {
      console.error('加载用户信息失败', error);
    }
  },

  async loadStats() {
    try {
      const res = await get('/mt/logs', { pageSize: 1000 });
      const logs = res.list || [];

      const totalReserve = logs.length;
      const winCount = logs.filter(l => l.status === 3).length;
      const winRate = totalReserve > 0
        ? (winCount / totalReserve * 100).toFixed(1) + '%'
        : '0%';

      this.setData({
        stats: { totalReserve, winCount, winRate }
      });
    } catch (error) {
      console.error('加载统计失败', error);
    }
  },

  // 跳转账号管理
  goAccountList() {
    wx.navigateTo({
      url: '/pages/accounts/list'
    });
  },

  // 跳转预约记录
  goLogs() {
    wx.switchTab({
      url: '/pages/logs/list'
    });
  },

  // 订阅消息
  subscribeMessage() {
    const tmplIds = [
      'your-template-id-1', // 预约结果通知
      'your-template-id-2'  // 中签通知
    ];

    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        const subscribed = tmplIds.some(id => res[id] === 'accept');
        this.setData({ subscribed });

        if (subscribed) {
          wx.showToast({ title: '订阅成功', icon: 'success' });
        } else {
          wx.showToast({ title: '请允许订阅消息', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '订阅失败', icon: 'none' });
      }
    });
  },

  // 关于
  showAbout() {
    wx.showModal({
      title: 'i茅台助手',
      content: '本小程序用于自动预约i茅台，每日定时执行预约任务并推送结果通知。\n\n仅供学习交流使用，请勿用于商业用途。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 检查更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showModal({
          title: '发现新版本',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      } else {
        wx.showToast({ title: '已是最新版本', icon: 'success' });
      }
    });

    updateManager.onUpdateFailed(() => {
      wx.showToast({ title: '更新失败', icon: 'none' });
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'i茅台助手 - 自动预约，中签提醒',
      path: '/pages/index/index'
    };
  }
});
