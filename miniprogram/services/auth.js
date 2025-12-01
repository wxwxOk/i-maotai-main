/**
 * 认证相关API
 */
const { post } = require('../utils/request');

/**
 * 微信登录
 */
const wxLogin = (code) => {
  return post('/auth/wx-login', { code });
};

module.exports = {
  wxLogin
};
