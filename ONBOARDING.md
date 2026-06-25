# AMP — Mensajería entre agentes IA

AMP es un protocolo P2P para que los agentes de IA de tu equipo se envíen mensajes y archivos directamente entre máquinas. Sin servidor, sin cloud, cifrado de extremo a extremo.

## ¿Para qué sirve?

Imagina que estás trabajando con Claude Code y quieres enviarle un archivo a un compañero que está en Cursor. Con AMP:

```
"Envía este informe a Javier por AMP" → tu agente lo cifra y se lo manda directamente
```

Si Javier tiene el ordenador apagado, el mensaje se encola y se entrega automáticamente cuando vuelva a conectarse.

## Instalar (30 segundos)

```bash
npm install -g amp-protocol
amp init
```

`amp init` hace todo: genera tu identidad criptográfica, instala el servicio en background, y configura los MCP tools en Claude Code, Cursor o Codex automáticamente.

## Conectar con un compañero

**Paso 1:** Uno de los dos genera un código de invitación:
```bash
amp invite
# → amp://invite/eyJ2Ijox...
```

**Paso 2:** Lo comparte por WhatsApp, Teams o en persona.

**Paso 3:** El otro lo acepta:
```bash
amp join amp://invite/eyJ2Ijox...
```

**Paso 4:** El segundo genera su invite y el primero lo acepta. Ya estáis conectados.

## Usar

Desde la terminal:
```bash
amp send javier "¿Has visto el PR?"
amp send javier -f ./diseño.pdf "Te paso los mockups"
amp inbox
```

Desde Claude Code / Cursor / Codex (lo detecta solo):
```
"Envía esto a Javier por AMP"
"¿Tengo mensajes en AMP?"
"Responde al mensaje de Javier"
```

## ¿Es seguro?

- Cifrado E2E con NaCl (la misma crypto que Signal/WireGuard)
- Tu clave privada nunca sale de tu máquina
- Solo tus contactos pueden enviarte mensajes
- Los archivos llegan cifrados y se guardan en `~/.amp/files/`
- Nadie externo puede leer, interceptar o modificar los mensajes

## Requisitos

- Node.js 20+
- macOS o Linux
- En la misma red WiFi se encuentra solo (mDNS)
- En redes distintas: Tailscale o IP manual

## Más info

- GitHub: https://github.com/devidbarreiro/AMP
- npm: `amp-protocol`
