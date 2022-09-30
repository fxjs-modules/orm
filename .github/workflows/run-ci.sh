PWD=$(pwd)

case "${RUNNER_OS}" in
    Windows) ;;
    macOS)
        brew install psqlodbc;
        # cd Dockerfile;
        # docker-compose up -d;
        ;;
    Linux)
        sudo apt-get update;
        sudo apt-get install odbc-postgresql
        ls -la /usr/lib/x86_64-linux-gnu/odbc;
        sudo ln -s /usr/lib/x86_64-linux-gnu/odbc/psqlodbca.so /usr/local/lib/psqlodbca.so
        sudo ln -s /usr/lib/x86_64-linux-gnu/odbc/psqlodbcw.so /usr/local/lib/psqlodbcw.so
        cd Dockerfile;
        docker-compose up -d;
        ;;
esac

cd $PWD;

npm install;
npm run bootstrap:noci;
npm run ci;