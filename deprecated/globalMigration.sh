#!bin/bash

# Server database
node dbMigrate-stats # OK
node dbMigrate-player # OK
node dbMigrate-units # OK
node dbMigrate-planets # A tester
node dbMigrate-fleets # A tester
node dbMigrate-planets-fleetsId # A tester

# Global database
# node dbMigrate-servers => Dejà migré à la main
node dbMigrate-users
# node dbMigrate-bans => Table vide
node dbMigrate-privileges
node dbMigrate-userGameIds
node dbMigrate-announces
# node dbMigrate-ranks => Nouveau système donc pas de migration
# ?