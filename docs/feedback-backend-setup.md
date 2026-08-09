# 意见反馈后台一次性配置

这套反馈功能同时接收国内版 `cn` 与海外版 `global` 的匿名文字反馈，不支持附件。反馈记录保存在 Supabase 私密表中；每次新增记录后，由 Supabase Database Webhook 调用 Edge Function，再通过 Resend 向负责人 Gmail 发送邮件通知。

公开代码中不能填写 Gmail、API Key 或 Webhook 密钥。下列值只放在 Supabase 后台。

## 1. 建立私密数据表

1. 打开 Supabase 项目的 SQL Editor。
2. 运行 `prototype/supabase-schema.sql` 的最新完整内容。
3. 确认 `public.user_feedback` 和 `public.feedback_admins` 已建立且 RLS 已启用。

匿名用户只能新增反馈，不能读取、修改或删除任何反馈记录。

## 2. 只登记负责人的 Gmail 账号

1. 负责人先在海外版使用自己的 Gmail 完成一次 Google 登录。
2. 在 Supabase SQL Editor 运行下列语句，把占位地址换成负责人的真实 Gmail：

```sql
insert into public.feedback_admins (user_id)
select id
from auth.users
where lower(email) = lower('OWNER_GMAIL_HERE')
on conflict (user_id) do nothing;
```

权限依据是 Supabase 的 `auth.users.id`，不是前端显示的邮箱文字。其他 Gmail 即使能正常登录学习，也无法读取反馈记录。

## 3. 配置邮件通知密钥

在 Resend 建立 API Key，然后到 Supabase Dashboard 的 Edge Function Secrets 添加：

- `RESEND_API_KEY`：Resend API Key。
- `FEEDBACK_OWNER_EMAIL`：接收通知的负责人 Gmail。
- `FEEDBACK_WEBHOOK_SECRET`：自行生成的长随机字符串。
- `FEEDBACK_FROM_EMAIL`：可选；完成发信域名验证后填写。未填写时使用代码中的测试发件地址。

不要把这些值写进 Git、`cloud-config.js` 或浏览器代码。

## 4. 部署通知函数

部署 `supabase/functions/feedback-notify`，并为这个数据库 Webhook 函数关闭 JWT 校验（例如使用 `supabase functions deploy feedback-notify --no-verify-jwt`）。该函数不依赖浏览器登录令牌，只接受 POST 请求，并要求请求头：

```text
x-feedback-webhook-secret: 与 FEEDBACK_WEBHOOK_SECRET 完全相同
```

## 5. 建立 Database Webhook

在 Supabase Dashboard 建立 Database Webhook：

- Table：`public.user_feedback`
- Event：只选择 `INSERT`
- Method：`POST`
- URL：已部署的 `feedback-notify` Edge Function URL
- Header：添加上面的 `x-feedback-webhook-secret`

## 6. 上线前验证

1. 不登录，从国内版提交一条至少 10 字的反馈，确认成功且没有附件入口。
2. 不登录，从海外版再提交一条，确认两条记录的 `edition` 分别是 `cn` 与 `global`。
3. 确认负责人 Gmail 收到两封通知。
4. 用普通 Gmail 登录，确认看不到反馈记录。
5. 用已登记的负责人 Gmail 登录海外版，确认可以查看记录并把状态改为“已查看”或“已解决”。
6. 刷新页面，再确认状态仍然保存。

如果邮件失败，反馈记录仍应保存在 Supabase；先在 Database Webhook 日志与 Edge Function 日志中检查失败原因，再重新发送通知。
