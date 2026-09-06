import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { IFile } from 'src/common/interfaces/index';
import { StorageApproachEnum } from 'src/common/enums/index';
import { tmpdir } from 'node:os';
import multer from 'multer';

export const fileFieldValidation = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  video: ['video/mp4'],
};
export const localMulter = ({
  validation = [],
  folder = 'public',
  fileSize = 2,
}: {
  validation?: string[];
  folder?: string;
  fileSize?: number;
}) => {
  return {
    storage: diskStorage({
      destination(req: Request, file: IFile, callback: Function) {
        const fullPath = resolve(`./uploads/${folder}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        return callback(null, fullPath);
      },

      filename(req: Request, file: IFile, callback: Function) {
        const uniqueFileName = randomUUID() + '_' + file.originalname;
        file.finalPath = `uploads/${folder}`;
        callback(null, uniqueFileName);
      },
    }),
    fileFilter(req: Request, file: IFile, callback: Function) {
      if (!validation.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file format'));
      }
      return callback(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  };
};

export const cloudMulter = ({
  storageApproach = StorageApproachEnum.MEMORY,

  validation = [],
  folder = 'public',
  fileSize = 2,
}: {
  storageApproach?: StorageApproachEnum;
  validation?: string[];
  folder?: string;
  fileSize?: number;
}) => {
  return {
    storage:
      storageApproach == StorageApproachEnum.MEMORY
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination: function (
              req: Request,
              file: Express.Multer.File,
              cb: (error: Error | null, destination: string) => void,
            ) {
              cb(null, tmpdir());
            },
            filename: function (
              req: Request,
              file: Express.Multer.File,
              cb: (error: Error | null, filename: string) => void,
            ) {
              cb(null, `${randomUUID()}__${file.originalname}`);
            },
          }),
    fileFilter(req: Request, file: IFile, callback: Function) {
      if (!validation.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file format'));
      }
      return callback(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  };
};
