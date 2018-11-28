# PLATFORM Common
**Use** General helpers and game logic classes that the client and the server extend.

## FILE World.ts
**Use** Contains methods to do things to the game. Events (in the form of abstract methods) are used to signal when state which is supposed to be replicated is changed. The server extension of the class will implement these

# PLATFORM Server
## FILE Main.ts
**Use** Set up http and socket server. Parses packets and runs world methods. Never sends replication packets after action, methods will handle that.