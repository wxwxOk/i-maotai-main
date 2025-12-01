/**
 * i茅台相关API
 */

const { get, post, put, del } = require('../utils/request');

/**
 * 发送验证码
 */
const sendCode = (mobile) => {
  return post('/mt/send-code', { mobile });
};

/**
 * 登录i茅台
 */
const login = (mobile, code) => {
  return post('/mt/login', { mobile, code });
};

/**
 * 获取账号列表
 */
const getAccounts = () => {
  return get('/mt/accounts');
};

/**
 * 获取账号详情
 */
const getAccountDetail = (id) => {
  return get(`/mt/accounts/${id}`);
};

/**
 * 删除账号
 */
const deleteAccount = (id) => {
  return del(`/mt/accounts/${id}`);
};

/**
 * 更新账号位置
 */
const updateLocation = (id, data) => {
  return put(`/mt/accounts/${id}/location`, data);
};

/**
 * 获取可预约商品列表
 */
const getItems = () => {
  return get('/mt/items');
};

/**
 * 获取预约配置
 */
const getConfig = (accountId) => {
  return get(`/mt/accounts/${accountId}/config`);
};

/**
 * 更新预约配置
 */
const updateConfig = (accountId, data) => {
  return put(`/mt/accounts/${accountId}/config`, data);
};

/**
 * 手动触发预约
 */
const manualReserve = (accountId) => {
  return post(`/mt/accounts/${accountId}/reserve`);
};

/**
 * 获取预约日志
 */
const getLogs = (params) => {
  return get('/mt/logs', params);
};

/**
 * 获取今日预约状态
 */
const getTodayStatus = () => {
  return get('/mt/today-status');
};

module.exports = {
  sendCode,
  login,
  getAccounts,
  getAccountDetail,
  deleteAccount,
  updateLocation,
  getItems,
  getConfig,
  updateConfig,
  manualReserve,
  getLogs,
  getTodayStatus
};
