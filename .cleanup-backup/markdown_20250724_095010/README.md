# 🛑 Workflows Temporalmente Deshabilitados

## ¿Por qué están deshabilitados?

Los workflows de CI/CD están **temporalmente pausados** mientras realizamos:
- 🧪 Pruebas de desarrollo
- 🔧 Ajustes de configuración  
- 📝 Actualizaciones de código
- 🚀 Mejoras de performance

## 📁 Workflows pausados:

- `ci-cd.yml` - Pipeline principal de CI/CD
- `security.yml` - Análisis de seguridad semanal

## 🔄 Para reactivar cuando terminemos:

```bash
# Mover workflows de vuelta al directorio activo
mv .github/workflows-disabled/*.yml .github/workflows/

# Eliminar directorio temporal
rmdir .github/workflows-disabled

# Commit para reactivar
git add .github/workflows/
git commit -m "ci: reactivate CI/CD workflows after testing phase"
git push
```

## ⚡ Beneficios durante desarrollo:

- ✅ **Sin esperas** en cada commit
- ✅ **Commits rápidos** sin ejecutar checks
- ✅ **Ahorro de GitHub Actions minutes**
- ✅ **Logs más limpios** durante desarrollo

---

**🎯 Recuerda:** Una vez terminadas las pruebas, mover los workflows de vuelta para production-ready code. 