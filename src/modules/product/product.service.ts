import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor() {}
  list() {
    return [{ id: 1, name: 'IPhone' }];
  }
}
