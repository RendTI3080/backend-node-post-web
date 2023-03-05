let io;

module.exports = {
    init: httpsServer => {
        io = require('socket.io')(httpsServer, {
            cors: {
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            }
        });
        return io;
    },
    getIo: () => {
        if(!io){
            throw new Error('Socket.io not initialized');
        }
        return io;
    }
}