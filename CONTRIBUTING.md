# Contributing to SLAMint 🤝

Thank you for considering contributing to **SLAMint** — an open-source ticketing/helpdesk tool.
Your contributions help make this project stronger and more useful for everyone.

---

## 🛠 Ways to Contribute

- **Report Bugs** 🐛
  Submit issues when you find unexpected behavior or problems. Please include steps to reproduce and environment details.

- **Suggest Features** 💡
  Open issues for feature ideas. Clearly describe the problem you want solved and potential approaches.

- **Improve Documentation** 📖
  Fix typos, improve explanations, or add examples in `README.md`, `docs/`, or inline code comments.

- **Write Code** 💻
  Help with bug fixes, new features, tests, or refactoring. See [Development Setup](#-development-setup).

- **Review Pull Requests** 🔍
  Provide constructive feedback on other contributors’ work.

---

## 📋 Contribution Workflow

1. **Fork** the repository and create your branch from `main`.

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** with clear commit messages following [Conventional Commits](https://www.conventionalcommits.org/).
   Example:

   ```
   feat(auth): add role-based access guard
   fix(api): resolve user serialization issue
   ```

3. **Run tests & linting** before pushing:

   ```bash
   pnpm lint
   pnpm test
   ```

4. **Push** your branch and open a **Pull Request (PR)** against `main`.

   - Use the provided PR template.
   - Reference related issues (e.g., `Closes #42`).

5. Wait for **review & approval** by maintainers.
6. Once merged, 🎉 your changes become part of SLAMint!

---

## 🔑 Development Setup

- Install [Node.js](https://nodejs.org/) (>=18) & [pnpm](https://pnpm.io/)
- Install dependencies:

  ```bash
  pnpm install
  ```

- Start dev server (example):

  ```bash
  pnpm nx serve api-gateway
  ```

See [README.md](./README.md) for detailed setup instructions.

---

## ✅ Code Style & Standards

- Follow **TypeScript best practices**.
- Lint with ESLint + Prettier.
- Write **unit/integration tests** for new features.
- Keep commits **atomic** (one logical change per commit).
- Use **English** for code, comments, and docs.

---

## 🧑‍🤝‍🧑 Community Guidelines

- Be respectful and inclusive.
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md).
- Engage constructively in discussions.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---
