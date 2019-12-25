## Прокси сервис для навыка JustAi Island

Git: git@github.com:sbdevgames/justai-proxy.git  
Deployed: 

Диалоговый движок JustAi пока не умеет возвращать ответы в формате 
[Google AppResponse](https://developers.google.com/assistant/conversational/webhook/reference/rest/Shared.Types/AppResponse)
для Interactive Canvas. Этот проект может конверитировать ответы от JustAi в нужный формат,
подставляя в Response адрес web-приложения для игры Выживание на острове.

#### Build and run
```bash
docker build -t chmutin/justai-proxy-island .
docker run -p 49160:3000 -d chmutin/justai-proxy-island:latest
```
#### Разработчик
Чмутин Георгий Николаевич <Chmutin.G.Ni@sberbank.ru>
