# Database Configuration

This project uses different database locations for development and production environments.

## Development Mode

In development, the database is stored in the project directory for easy access:

- **Location**: `./data/pos_system.db`(hardcoded)
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

1. Navigate to `./data/`
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
data/*.db
data/*.db-wal
data/*.db-shm
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

# Using Your Existing Database

If you have an existing database file in a different location, here are several ways to integrate it with the new system:

## Option 1: Set Custom Database Path (Recommended)

Use the `POS_DB_PATH` environment variable to point to your existing database:

### For Development:

```bash
# Set the environment variable to your existing database
export POS_DB_PATH="/path/to/your/existing/database.db"
npm start
```

### For Production Build:

```bash
# Set the environment variable before launching
export POS_DB_PATH="/path/to/your/existing/database.db"
./dist/AuraSwift.app/Contents/MacOS/AuraSwift
```

### Permanent Configuration:

Create a `.env` file in the project root:

```bash
POS_DB_PATH="/path/to/your/existing/database.db"
```

## Option 2: Copy Database to Development Location

Copy your existing database to the development data directory:

```bash
# Create the data directory if it doesn't exist
mkdir -p ./data

# Copy your existing database
cp "/path/to/your/existing/database.db" "./data/pos_system.db"

# Start the application normally
npm start
```

## Option 3: Copy Database to Production Location

Move your database to the production location:

### macOS:

```bash
# Create the application data directory
mkdir -p "$HOME/Library/Application Support/AuraSwift"

# Copy your existing database
cp "/path/to/your/existing/database.db" "$HOME/Library/Application Support/AuraSwift/pos_system.db"
```

### Windows:

```cmd
# Create the application data directory
mkdir "%APPDATA%\AuraSwift"

# Copy your existing database
copy "C:\path\to\your\existing\database.db" "%APPDATA%\AuraSwift\pos_system.db"
```

### Linux:

```bash
# Create the application data directory
mkdir -p "$HOME/.config/AuraSwift"

# Copy your existing database
cp "/path/to/your/existing/database.db" "$HOME/.config/AuraSwift/pos_system.db"
```

## Verify Database Integration

After setting up your database, verify it's working:

1. **Check database location in the app:**

   - The application has a database info feature accessible through the dashboard
   - It will show the current database path and basic statistics

2. **Test with the utility script:**
   ```bash
   # Test with your custom path
   POS_DB_PATH="/path/to/your/existing/database.db" node test-db-path.mjs
   ```

## Database Schema Compatibility

The application expects certain tables and columns. If your existing database has a different schema:

1. **Backup your existing database first:**

   ```bash
   cp "/path/to/your/existing/database.db" "/path/to/your/existing/database.backup.db"
   ```

2. **Run the application once** - it will automatically create missing tables and columns

3. **Check the migration logs** in the console for any schema updates

## Need Help?

- Run `npm run db:info` to see database configuration help
- Check `DATABASE_CONFIG.md` for detailed configuration options
- Use the test utility: `node test-db-path.mjs` to verify path logic
