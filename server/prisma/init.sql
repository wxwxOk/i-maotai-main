-- 创建数据库
CREATE DATABASE IF NOT EXISTS imaotai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE imaotai;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
    unionid VARCHAR(64) COMMENT '微信unionid',
    nickname VARCHAR(64) COMMENT '微信昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- i茅台账号表
CREATE TABLE IF NOT EXISTS mt_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    mobile VARCHAR(20) NOT NULL COMMENT 'i茅台手机号',
    mt_user_id VARCHAR(32) COMMENT 'i茅台用户ID',
    token TEXT COMMENT 'i茅台Token',
    cookie TEXT COMMENT 'i茅台Cookie',
    device_id VARCHAR(64) COMMENT '设备ID',
    province_name VARCHAR(32) COMMENT '省份',
    city_name VARCHAR(32) COMMENT '城市',
    lat VARCHAR(32) COMMENT '纬度',
    lng VARCHAR(32) COMMENT '经度',
    address VARCHAR(255) COMMENT '详细地址',
    status TINYINT DEFAULT 1 COMMENT '状态: 1正常 0禁用',
    token_expire_at DATETIME COMMENT 'Token过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='i茅台账号表';

-- 预约配置表
CREATE TABLE IF NOT EXISTS reservation_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL UNIQUE COMMENT '关联账号ID',
    item_codes VARCHAR(255) COMMENT '商品代码,多个用@分隔',
    shop_type TINYINT DEFAULT 1 COMMENT '门店类型: 1出货量最大 2距离最近',
    reserve_minute TINYINT DEFAULT 9 COMMENT '预约分钟(9点后第几分钟)',
    random_minute TINYINT DEFAULT 0 COMMENT '是否随机分钟: 0随机 1固定',
    auto_travel TINYINT DEFAULT 1 COMMENT '自动旅行: 1开启 0关闭',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用: 1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约配置表';

-- 预约日志表
CREATE TABLE IF NOT EXISTS reservation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '关联账号ID',
    item_id VARCHAR(32) COMMENT '商品ID',
    item_name VARCHAR(64) COMMENT '商品名称',
    shop_id VARCHAR(32) COMMENT '门店ID',
    shop_name VARCHAR(128) COMMENT '门店名称',
    status TINYINT COMMENT '状态: 0预约中 1预约成功 2预约失败 3中签 4未中签',
    result_msg TEXT COMMENT '结果信息',
    reserve_date DATE COMMENT '预约日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_reserve_date (reserve_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约日志表';

-- 商品表
CREATE TABLE IF NOT EXISTS items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    item_id VARCHAR(32) NOT NULL UNIQUE COMMENT '商品ID',
    title VARCHAR(128) COMMENT '商品名称',
    content VARCHAR(255) COMMENT '商品描述',
    picture_url VARCHAR(255) COMMENT '图片URL',
    price DECIMAL(10,2) COMMENT '价格',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';
