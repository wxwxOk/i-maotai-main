/**
 * API请求封装
 */

const BASE_URL = 'http://172.16.48.140:3000/api'; // 本地开发服务器地址

// 请求拦截
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Token过期，跳转登录
          wx.removeStorageSync('token');
          wx.redirectTo({ url: '/pages/login/login' });
          reject(new Error('登录已过期'));
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// GET请求
const get = (url, data) => request({ url, method: 'GET', data });

// POST请求
const post = (url, data) => request({ url, method: 'POST', data });

// PUT请求
const put = (url, data) => request({ url, method: 'PUT', data });

// DELETE请求
const del = (url, data) => request({ url, method: 'DELETE', data });

module.exports = {
  request,
  get,
  post,
  put,
  del,
  BASE_URL
};
