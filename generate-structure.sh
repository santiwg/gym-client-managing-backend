#!/bin/bash

# Sales
nest g module sales
nest g controller sales/sale 
nest g service sales/sale 
nest g controller sales/customer 
nest g service sales/customer 
nest g controller sales/payment-collection 
nest g service sales/payment-collection 

# Purchases
nest g module purchases
nest g controller purchases/purchase 
nest g service purchases/purchase 
nest g controller purchases/supplier 
nest g service purchases/supplier 
nest g controller purchases/payment 
nest g service purchases/payment 

# Products
nest g module products
nest g controller products/product 
nest g service products/product 
nest g controller products/ingredient 
nest g service products/ingredient 
nest g service products/stock-movement 
nest g controller products/production-instance 
nest g service products/production-instance 

# Employees
nest g module employees
nest g controller employees/employee 
nest g service employees/employee 
nest g controller employees/employee-role 
nest g service employees/employee-role 

# Bakery
nest g module bakery
nest g controller bakery/bakery 
nest g service bakery/bakery 
nest g controller bakery/branch 
nest g service bakery/branch 

# Auth
nest g module auth
nest g controller auth/user 
nest g service auth/user 

# Shared
nest g module shared
nest g controller shared/state shared
nest g service shared/state shared
nest g controller shared/payment-method 
nest g service shared/payment-method 

# CIF
nest g module cif
nest g controller cif/cif 
nest g service cif/cif 
nest g controller cif/cost-type 
nest g service cif/cost-type

# Crear archivos entity y carpetas dtos para cada feature

# Sales
mkdir -p src/sales/sale/dtos
touch src/sales/sale/sale.entity.ts src/sales/sale/sale-detail.entity.ts
mkdir -p src/sales/customer/dtos
touch src/sales/customer/customer.entity.ts
mkdir -p src/sales/payment-collection/dtos
touch src/sales/payment-collection/payment-collection.entity.ts src/sales/payment-collection/payment-collection-detail.entity.ts

# Purchases
mkdir -p src/purchases/purchase/dtos
touch src/purchases/purchase/purchase.entity.ts src/purchases/purchase/purchase-detail.entity.ts
mkdir -p src/purchases/supplier/dtos
touch src/purchases/supplier/supplier.entity.ts
mkdir -p src/purchases/payment/dtos
touch src/purchases/payment/payment.entity.ts src/purchases/payment/payment-detail.entity.ts

# Products
mkdir -p src/products/product/dtos
touch src/products/product/product.entity.ts src/products/product/recipe-item.entity.ts
mkdir -p src/products/ingredient/dtos
touch src/products/ingredient/ingredient.entity.ts
mkdir -p src/products/stock-movement/dtos
touch src/products/stock-movement/stock-movement.entity.ts
mkdir -p src/products/production-instance/dtos
touch src/products/production-instance/production-instance.entity.ts src/products/production-instance/production-instance-detail.entity.ts

# Employees
mkdir -p src/employees/employee/dtos
touch src/employees/employee/employee.entity.ts
mkdir -p src/employees/employee-role/dtos
touch src/employees/employee-role/employee-role.entity.ts

# Bakery
mkdir -p src/bakery/bakery/dtos
touch src/bakery/bakery/bakery.entity.ts
mkdir -p src/bakery/branch/dtos
touch src/bakery/branch/branch.entity.ts

# Auth
mkdir -p src/auth/user/dtos
touch src/auth/user/user.entity.ts
mkdir -p src/auth/auth-middleware
touch src/auth/auth-middleware/auth-middleware.ts

# Shared
mkdir -p src/shared/state/dtos
touch src/shared/state/state.entity.ts
mkdir -p src/shared/payment-method/dtos
touch src/shared/payment-method/payment-method.entity.ts
mkdir -p src/shared/check
touch src/shared/check/check.entity.ts
mkdir -p src/shared/check-type
touch src/shared/check-type/check-type.entity.ts

# CIF
mkdir -p src/cif/cif/dtos
touch src/cif/cif/cif.entity.ts
mkdir -p src/cif/cost-type/dtos
touch src/cif/cost-type/cost-type.entity.ts