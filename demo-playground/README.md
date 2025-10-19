# Paired Comments Demo Playground

**Version:** 2.1.6
**Status:** 🚧 In Development

Interactive demo environment showcasing the Paired Comments VS Code extension in a containerized, GitHub-like UI.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- 4GB RAM minimum
- Port 3000 available

### Start the Demo

```bash
cd demo-playground
docker-compose up
```

Access the demo at **http://localhost:3000**

### Development Mode (with hot-reload)

```bash
npm install
npm run dev
```

### Stop the Demo

```bash
docker-compose down
```

## 📁 Project Structure

```
demo-playground/
├── src/
│   ├── app/                  # Next.js 14 app directory
│   ├── components/           # React components
│   ├── lib/                  # Utilities & VS Code shim
│   └── data/examples/        # Pre-loaded code examples
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Container orchestration
└── package.json              # Dependencies
```

## 🎯 Features (Planned)

- [x] Phase 1: Container Setup
- [ ] Phase 2: Fake GitHub UI
- [ ] Phase 3: Monaco Editor Integration
- [ ] Phase 4: VS Code API Shim
- [ ] Phase 5: Extension Integration
- [ ] Phase 6: Example Files (20+)
- [ ] Phase 7: Export & Share
- [ ] Phase 8: Polish & Testing

## 📚 Documentation

See [v2.1.3-github-demo-playground.md](../docs/milestones/v2.1.3-github-demo-playground.md) for full design document.

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
docker-compose down
# Or change port in docker-compose.yml
```

### Container won't start
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Changes not reflecting
```bash
# Rebuild with no cache
npm run docker:rebuild
```

## 🔗 Links

- [Paired Comments Extension](../)
- [Design Document](../docs/milestones/v2.1.3-github-demo-playground.md)
- [Roadmap](../docs/ROADMAP.md)
