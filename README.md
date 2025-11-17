# Minimal On-Chain Voting DAO (EVM)

Простой DAO-проект для Ethereum: стейкайте токены, получайте право голоса, голосуйте за предложения.

## Особенности

- **Токен управления (ERC20)**: Стандартный ERC20 токен с функцией mint для владельца
- **Система голосования**: Голоса пропорциональны балансу токенов
- **Treasury с multisig**: Безопасное управление средствами DAO
- **Современный UI**: React + Wagmi + Viem для взаимодействия с контрактами

## Структура проекта

```
├── contracts/           # Смарт-контракты Solidity
│   ├── Token.sol       # ERC20 токен с mint
│   ├── Governor.sol    # Контракт голосования
│   └── Treasury.sol    # Treasury с multisig
├── scripts/            # Скрипты деплоя
│   └── deploy.js       # Деплой всех контрактов
├── test/               # Тесты контрактов
│   └── DAO.test.js     # Comprehensive тесты
├── frontend/           # React приложение
│   └── src/
│       ├── components/ # UI компоненты
│       ├── wagmi.js    # Конфигурация Wagmi
│       └── contracts.js# АБИ и адреса контрактов
└── hardhat.config.js   # Конфигурация Hardhat
```

## Технологии

### Smart Contracts
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js v6

### Frontend
- React 18
- Vite
- Wagmi v2
- Viem v2
- TanStack Query

## Установка и запуск

### Требования
- Node.js >= 18
- npm или yarn
- MetaMask или другой Web3 кошелек

### 1. Установка зависимостей

```bash
# Установка зависимостей для контрактов
npm install

# Установка зависимостей для frontend
cd frontend
npm install
cd ..
```

### 2. Компиляция контрактов

```bash
npm run compile
```

### 3. Запуск тестов

```bash
npm test
```

## Деплой

### Локальная сеть (для разработки)

1. Запустите локальную сеть Hardhat:
```bash
npm run node
```

2. В новом терминале задеплойте контракты:
```bash
npm run deploy:local
```

3. Скопируйте адреса контрактов из вывода и обновите `frontend/src/contracts.js`

### Testnet (Sepolia)

1. Создайте файл `.env` в корне проекта:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=ваш_приватный_ключ
ETHERSCAN_API_KEY=ваш_etherscan_api_key
```

2. Задеплойте контракты:
```bash
npm run deploy:sepolia
```

3. Контракты автоматически верифицируются на Etherscan

4. Обновите адреса в `frontend/src/contracts.js`

## Запуск Frontend

1. Обновите WalletConnect Project ID в `frontend/src/wagmi.js`:
   - Получите Project ID на https://cloud.walletconnect.com
   - Замените `YOUR_PROJECT_ID` на ваш ID

2. Запустите dev сервер:
```bash
npm run frontend
```

3. Откройте http://localhost:5173

## Использование

### Для пользователей

1. **Подключите кошелек**: Нажмите "Connect Wallet" и выберите MetaMask
2. **Получите токены**: Свяжитесь с владельцем DAO для получения токенов
3. **Создайте предложение**: Введите описание и нажмите "Create Proposal"
4. **Голосуйте**: Выберите "Vote For" или "Vote Against" на активных предложениях
5. **Просматривайте результаты**: Отслеживайте статус предложений в реальном времени

### Для владельца контракта

Владелец токена может минтить новые токены:
```javascript
// Через ethers.js
const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer)
await tokenContract.mint(recipientAddress, amount)
```

Владелец Treasury может обновить multisig адрес:
```javascript
const treasuryContract = new ethers.Contract(treasuryAddress, TREASURY_ABI, signer)
await treasuryContract.updateMultisig(newMultisigAddress)
```

## Архитектура контрактов

### Token.sol (DAOToken)
- Стандартный ERC20 токен
- Функция `mint()` только для владельца
- Используется для определения веса голосов

### Governor.sol
- Создание предложений с описанием
- Голосование пропорционально балансу токенов
- 3-дневный период голосования (настраивается)
- Состояния: Active, Succeeded, Defeated, Executed
- События: ProposalCreated, Voted

### Treasury.sol
- Хранение средств DAO
- Multisig контроль для выполнения решений
- Возможность обновления multisig адреса
- События: FundsReceived, FundsWithdrawn, ProposalExecuted

## Тестирование

Проект включает comprehensive тесты:

```bash
npm test
```

Тесты покрывают:
- ✅ Создание и минт токенов
- ✅ Создание предложений
- ✅ Голосование (за/против)
- ✅ Выполнение предложений
- ✅ Treasury функционал
- ✅ Интеграционные сценарии

## Безопасность

- Используются проверенные контракты OpenZeppelin
- Все функции администратора защищены модификатором `onlyOwner`
- Treasury контролируется multisig адресом
- Нет возможности голосовать дважды
- Голосовать могут только держатели токенов

## Roadmap

Потенциальные улучшения:
- [ ] Квадратичное голосование
- [ ] Делегирование голосов
- [ ] Таймлок для выполнения решений
- [ ] Поддержка NFT для голосования
- [ ] Интеграция с IPFS для хранения предложений
- [ ] Snapshot интеграция для gas-free голосования

## Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## License

ISC

## Контакты

Если у вас есть вопросы или предложения, откройте Issue в GitHub.

---

**Важно**: Это минимальная версия DAO для образовательных целей. Для production использования рекомендуется:
- Полный аудит безопасности
- Расширенная система голосования
- Multi-sig контроль критических функций
- Таймлоки для выполнения решений