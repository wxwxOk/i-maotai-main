// app.js
App({
  onLaunch() {
    // 检查登录状态
    this.checkLogin();
  },

  globalData: {
    userInfo: null,
    token: null
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    } else {
      // 没有token，自动登录
      this.wxLogin().catch(err => {
        console.error('自动登录失败:', err);
      });
    }
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 发送code到后端换取token
            wx.request({
              url: 'http://192.168.5.235:3000/api/auth/wx-login',
              method: 'POST',
              data: { code: res.code },
              success: (response) => {
                if (response.data.token) {
                  this.globalData.token = response.data.token;
                  wx.setStorageSync('token', response.data.token);
                  resolve(response.data);
                } else {
                  reject(new Error('登录失败'));
                }
              },
              fail: reject
            });
          } else {
            reject(new Error('获取code失败'));
          }
        },
        fail: reject
      });
    });
  }
});
