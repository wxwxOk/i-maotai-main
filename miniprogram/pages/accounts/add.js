// pages/accounts/add.js
const mtApi = require('../../services/mt');

Page({
  data: {
    mobile: '',
    code: '',
    countdown: 0,
    loading: false,
    isMobileValid: false,
    canSubmit: false
  },

  // 手机号输入
  onMobileInput(e) {
    const mobile = e.detail.value;
    const isMobileValid = /^1[3-9]\d{9}$/.test(mobile);
    this.setData({
      mobile,
      isMobileValid,
      canSubmit: isMobileValid && this.data.code.length === 6
    });
  },

  // 验证码输入
  onCodeInput(e) {
    const code = e.detail.value;
    this.setData({
      code,
      canSubmit: this.data.isMobileValid && code.length === 6
    });
  },

  // 发送验证码
  async sendCode() {
    if (this.data.countdown > 0 || !this.data.isMobileValid) return;

    try {
      wx.showLoading({ title: '发送中...' });
      await mtApi.sendCode(this.data.mobile);
      wx.hideLoading();

      wx.showToast({ title: '验证码已发送', icon: 'success' });

      // 开始倒计时
      this.setData({ countdown: 60 });
      this.startCountdown();

    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      });
    }
  },

  // 倒计时
  startCountdown() {
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  // 登录
  async login() {
    if (!this.data.canSubmit || this.data.loading) return;

    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '登录中...' });

      await mtApi.login(this.data.mobile, this.data.code);

      wx.hideLoading();
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟跳转到账号详情页设置位置
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/accounts/list'
        });
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  }
});
