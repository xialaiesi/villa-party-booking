import { Module } from '@nestjs/common';
import { XhsNoteController } from './xhs-note.controller';
import { XhsNoteService } from './xhs-note.service';

@Module({
  controllers: [XhsNoteController],
  providers: [XhsNoteService],
  exports: [XhsNoteService],
})
export class XhsNoteModule {}
