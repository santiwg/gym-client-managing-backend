import { Module } from '@nestjs/common';
import { ClientController } from './client/client.controller';
import { ClientService } from './client/client.service';
import { SuscriptionService } from './client/suscription/suscription.service';
import { CobroService } from './client/fee-collection/fee-collection.service';
import { AsistenciaService } from './client/attendance/asistencia.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, SuscriptionService, CobroService, AsistenciaService]
})
export class ClientsModule {}
