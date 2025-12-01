// pages/accounts/detail.js
const mtApi = require('../../services/mt');

Page({
  data: {
    id: '',
    account: {},
    config: {},
    reserving: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
  },

  onShow() {
    this.loadDetail();
  },

  async loadDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await mtApi.getAccountDetail(this.data.id);

      // 格式化数据
      const account = {
        ...res,
        tokenExpireAt: res.tokenExpireAt ? this.formatDate(res.tokenExpireAt) : ''
      };

      // 处理商品名称
      const config = res.config || {};
      if (config.itemCodes) {
        const items = await mtApi.getItems();
        const itemNames = config.itemCodes.split('@').map(code => {
          const item = items.items?.find(i => i.itemId === code);
          return item?.title || code;
        }).join('、');
        config.itemNames = itemNames;
      }

      this.setData({ account, config });
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: async (res) => {
        if (res.name) {
          try {
            wx.showLoading({ title: '保存中...' });

            // 从地址解析省市
            const { provinceName, cityName } = this.parseAddress(res.address);

            await mtApi.updateLocation(this.data.id, {
              provinceName,
              cityName,
              lat: res.latitude.toString(),
              lng: res.longitude.toString(),
              address: res.name
            });

            wx.hideLoading();
            wx.showToast({ title: '保存成功', icon: 'success' });
            this.loadDetail();
          } catch (error) {
            wx.hideLoading();
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      },
      fail: () => {
        wx.showToast({ title: '请授权位置权限', icon: 'none' });
      }
    });
  },

  // 解析地址
  parseAddress(address) {
    // 简单解析，实际可使用地图API
    const provinces = ['北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门'];

    let provinceName = '';
    let cityName = '';

    for (const p of provinces) {
      if (address.includes(p)) {
        provinceName = p;
        // 提取城市
        const afterProvince = address.split(p)[1] || '';
        const cityMatch = afterProvince.match(/^(.+?)(市|区|县|自治州)/);
        if (cityMatch) {
          cityName = cityMatch[1] + (cityMatch[2] || '');
        }
        break;
      }
    }

    return { provinceName: provinceName || '未知', cityName: cityName || '未知' };
  },

  // 跳转预约配置
  goConfig() {
    wx.navigateTo({
      url: `/pages/reserve/config?id=${this.data.id}`
    });
  },

  // 切换预约状态
  async toggleEnabled(e) {
    const isEnabled = e.detail.value ? 1 : 0;
    try {
      await mtApi.updateConfig(this.data.id, { isEnabled });
      this.setData({ 'config.isEnabled': isEnabled });
      wx.showToast({
        title: isEnabled ? '已开启预约' : '已关闭预约',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 手动预约
  async manualReserve() {
    if (!this.data.account.provinceName) {
      wx.showToast({ title: '请先设置位置', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认预约',
      content: '确定要手动执行预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ reserving: true });
            const result = await mtApi.manualReserve(this.data.id);
            this.setData({ reserving: false });

            if (result.success) {
              wx.showToast({ title: '预约已提交', icon: 'success' });
            } else {
              wx.showToast({ title: result.message || '预约失败', icon: 'none' });
            }
          } catch (error) {
            this.setData({ reserving: false });
            wx.showToast({ title: '预约失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 重新登录
  relogin() {
    wx.navigateTo({
      url: '/pages/accounts/add'
    });
  },

  // 删除账号
  deleteAccount() {
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除吗？',
      confirmColor: '#f44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            await mtApi.deleteAccount(this.data.id);
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
  }
});
