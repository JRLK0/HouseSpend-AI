FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps || npm install

# Copiar el resto de los archivos
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
