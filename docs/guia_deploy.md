# Guia de Implantação na Vercel

O projeto foi preparado para ser enviado à Vercel. Siga os passos abaixo para concluir a implantação.

## Alterações Realizadas

- [x] Configuração profissional do **Tailwind CSS** (removendo o CDN para maior performance).
- [x] Criação do arquivo `vercel.json` para lidar com o roteamento do React.
- [x] Correção do nome do projeto no `package.json` (removendo caracteres especiais para compatibilidade).
- [x] Silenciei avisos do VS Code sobre as regras `@tailwind`.
- [x] Limpeza e otimização do `index.html`.
- [x] Verificação local do build via `npm run build` (Build concluído com sucesso!).

## Configuração do GitHub

O repositório local já foi inicializado e o primeiro commit foi realizado. Agora você só precisa conectar ao seu GitHub:

1. **Crie um repositório vazio no seu GitHub** chamado `luci-residence-gestao`.
2. **Copie e cole os comandos abaixo** no terminal do seu projeto:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/luci-residence-gestao.git
   git push -u origin main
   ```
   *(Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub)*

2. **Acesse o Painel da Vercel**:
   - Vá para [vercel.com](https://vercel.com) e faça login.
   - Clique em **"Add New..."** e selecione **"Project"**.

3. **Importe seu Repositório**:
   - Conecte sua conta Git se necessário.
   - Selecione o repositório `luci-berkembrock-residence---gestão`.

4. **Configure o Projeto**:
   - **Framework Preset**: Selecione `Other` ou `Vite` (geralmente detectado automaticamente).
   - **Root Directory**: `./` (padrão).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.

5. **Variáveis de Ambiente (CRÍTICO)**:
   - Expanda a seção **"Environment Variables"**.
   - Adicione apenas as chaves necessárias para seu projeto.

6. **Clique em Deploy**:
   - A Vercel iniciará o build e fornecerá uma URL pública (ex: `seu-projeto.vercel.app`).

## Configurações do Vercel.json

O arquivo [vercel.json](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/vercel.json) foi adicionado para garantir que, caso você decida trocar o roteamento de `HashRouter` para `BrowserRouter` no futuro, as rotas continuem funcionando sem erros 404.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> [!IMPORTANT]
> O uso de Gemini foi removido do projeto, então não é necessário configurar `GEMINI_API_KEY` para o deploy.
