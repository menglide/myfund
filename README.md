
## 部署
* 动态node接口使用vercel已经绑定git，提交master分支即可自动部署
* 静态访问页面在项目更目录之行 surge ./ menglide.surge.sh
* cloudflare的worker地址: https://sinajs.menlyd.workers.dev?code=sh000001,
## 相关资源
* [cloudflare](https://dash.cloudflare.com/) 部署worker可配置反向代理，也可以域名托管
* [vercel](https://vercel.com/) 部署nodejs应用
* [surge](https://surge.sh/) 部署静态页面应用
