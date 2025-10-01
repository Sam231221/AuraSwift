# Database Configuration

This project uses different database locations for development and production environments.

## Development Mode

In development, the database is stored in the project directory for easy access:

- **Location**: `./dev-data/pos_system.db`
- **Purpose**: Easy debugging, inspection, and version control exclusion
- **Access**: You can open this file with any SQLite browser tool

## Production Mode

In production builds, the database is stored in the proper user data directory:

### Windows

```
%APPDATA%/AuraSwift/pos_system.db
```

### macOS

```
~/Library/Application Support/AuraSwift/pos_system.db
```

### Linux

```
~/.config/AuraSwift/pos_system.db
```

## Environment Detection

The system automatically detects the environment using:

1. `process.env.NODE_ENV === 'development'`
2. `process.env.ELECTRON_IS_DEV === 'true'`
3. `!app.isPackaged` (Electron's built-in flag)

## Custom Database Path

You can override the database path using the environment variable:

```bash
export POS_DB_PATH="/custom/path/to/database.db"
```

## Database Inspection

### Development

1. Navigate to `./dev-data/`
2. Open `pos_system.db` with:
   - [DB Browser for SQLite](https://sqlitebrowser.org/)
   - [SQLite Viewer](https://inloop.github.io/sqlite-viewer/)
   - VS Code SQLite extensions

### Production

Use the database info API to get the exact location:

```javascript
const info = await window.databaseAPI.getInfo();
console.log(info.data.path);
```

## Files to Ignore

The `.gitignore` already excludes development database files:

```
dev-data/*.db
dev-data/*.db-wal
dev-data/*.db-shm
```

## Migration Between Environments

If you need to copy data from development to test a production build:

1. **Export data** from development database
2. **Build** the production app
3. **Run** the production app once to create the database structure
4. **Import data** into the production database location

## Troubleshooting

- **Permission errors**: Ensure the app has write access to the target directory
- **Database locked**: Close any SQLite browser tools before running the app
- **Missing tables**: The app automatically creates tables on first run
- **Path issues**: Check the console logs for the actual database path being used
