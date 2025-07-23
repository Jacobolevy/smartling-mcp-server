# 🏢 Smartling HTTP Server - Deployment Interno

**Solución para evitar errores de proxy corporativo**

## ❌ Problema que resuelve:
- `Connection Error: Failed to connect via proxy`
- Firewalls corporativos que bloquean conexiones externas
- Políticas de proxy que impiden acceso a Render.com

## ✅ Solución:
Deployar el servidor HTTP de Smartling **dentro de tu infraestructura corporativa**

---

## 🚀 Deployment Rápido

### Prerequisitos:
- Docker instalado
- Credenciales de Smartling
- Acceso a servidor interno de la empresa

### Paso 1: Configurar credenciales
```bash
# Configurar variables de entorno
export SMARTLING_USER_ID="tu-user-id"
export SMARTLING_SECRET="tu-secret"
export SMARTLING_PROJECT_ID="tu-project-id"
```

### Paso 2: Deploy automático
```bash
# Ejecutar script de deployment
./deploy-internal.sh
```

### Paso 3: Verificar funcionamiento
```bash
# Health check
curl http://localhost:3000/health

# Ver herramientas disponibles
curl http://localhost:3000/tools
```

---

## 🎯 Usar en tu Chat Interno

### URL interna:
```
http://TU-SERVIDOR-INTERNO:3000
```

### Ejemplos de uso:

#### JavaScript:
```javascript
// Cambiar URL externa por interna
const SMARTLING_URL = 'http://servidor-interno:3000';

async function callSmartling(toolName, args = {}) {
  const response = await fetch(`${SMARTLING_URL}/call/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  return await response.json();
}

// Sin problemas de proxy ✅
const projects = await callSmartling('smartling_get_projects');
```

#### Python:
```python
# Sin configuración de proxy necesaria
SMARTLING_URL = 'http://servidor-interno:3000'

def call_smartling(tool_name, args={}):
    response = requests.post(
        f"{SMARTLING_URL}/call/{tool_name}",
        json=args
    )
    return response.json()

# Funciona sin proxy ✅
projects = call_smartling('smartling_get_projects')
```

---

## 🐳 Deployment Avanzado

### Docker Compose:
```yaml
version: '3.8'
services:
  smartling-http:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SMARTLING_USER_ID=${SMARTLING_USER_ID}
      - SMARTLING_SECRET=${SMARTLING_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartling-http-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: smartling-http
  template:
    metadata:
      labels:
        app: smartling-http
    spec:
      containers:
      - name: smartling-http
        image: smartling-http-internal
        ports:
        - containerPort: 3000
        env:
        - name: SMARTLING_USER_ID
          valueFrom:
            secretKeyRef:
              name: smartling-secret
              key: user-id
        - name: SMARTLING_SECRET
          valueFrom:
            secretKeyRef:
              name: smartling-secret
              key: secret
```

---

## 🔧 Configuración Avanzada

### Variables de entorno:
```bash
SMARTLING_USER_ID=tu-user-id          # Requerido
SMARTLING_SECRET=tu-secret            # Requerido  
SMARTLING_PROJECT_ID=tu-project-id    # Opcional
PORT=3000                             # Puerto del servidor
NODE_ENV=production                   # Entorno
```

### Red interna:
```bash
# Para acceso desde otros servidores internos
docker run -d \
  --name smartling-http \
  --network=empresa-network \
  -p 3000:3000 \
  smartling-http-internal
```

---

## 📊 Monitoreo

### Logs en tiempo real:
```bash
docker logs -f smartling-http-server
```

### Métricas:
```bash
# Health check automático
curl http://localhost:3000/health

# Estado de herramientas
curl http://localhost:3000/tools | jq '.total_tools'
```

---

## 🆘 Soporte

### Problemas comunes:

#### 1. Container no inicia:
```bash
# Verificar logs
docker logs smartling-http-server

# Verificar variables de entorno
docker exec smartling-http-server env | grep SMARTLING
```

#### 2. No responde en puerto:
```bash
# Verificar puerto
docker port smartling-http-server

# Verificar proceso
docker exec smartling-http-server ps aux
```

#### 3. Errores de conexión Smartling:
```bash
# Verificar credenciales
curl -X POST http://localhost:3000/call/smartling_get_account_info \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## ✅ Ventajas del Deployment Interno:

- 🚫 **Sin errores de proxy**
- 🔒 **Datos dentro de la red corporativa**
- ⚡ **Latencia mínima**
- 🛡️ **Control total de seguridad**
- 📈 **Escalabilidad interna**

---

## 📞 Contacto:

**Para soporte técnico:**
- Verificar logs del container
- Revisar configuración de red
- Validar credenciales de Smartling 