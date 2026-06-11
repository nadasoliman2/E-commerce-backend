import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import { Get } from '@nestjs/common';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list() {
    const products = this.productService.list();

    return {
      message: 'Done',
      products,
    };
  }
}
