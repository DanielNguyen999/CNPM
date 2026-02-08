import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/auth/auth_state.dart';
import 'core/api/api_client.dart';
import 'services/auth_service.dart';
import 'services/product_service.dart';
import 'services/customer_service.dart';
import 'services/order_service.dart';
import 'services/debt_service.dart';
import 'services/reports_service.dart';
import 'services/notification_service.dart';
import 'services/sse_service.dart';
import 'services/admin_service.dart';
import 'services/inventory_service.dart';
import 'services/ai_service.dart';
import 'providers/notification_provider.dart';

import 'core/constants/app_routes.dart';
import 'core/constants/app_colors.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/pos/quick_order_screen.dart';
import 'screens/inventory/inventory_screen.dart';
import 'screens/debts/debt_collection_screen.dart';
import 'screens/debts/debt_detail_screen.dart';
import 'screens/customers/customer_list_screen.dart';
import 'screens/orders/order_list_screen.dart';
import 'screens/orders/order_detail_screen.dart';
import 'screens/reports/reports_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/suppliers/supplier_list_screen.dart';
import 'screens/cashbook/cashbook_screen.dart';
import 'screens/inventory_adjustment/inventory_adjustment_screen.dart';
import 'screens/inventory/product_form_screen.dart';
import 'models/product.dart';

class BizFlowApp extends StatelessWidget {
  final ApiClient apiClient;

  const BizFlowApp({super.key, required this.apiClient});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) {
          final authState = AuthState();
          apiClient.updateAuthState(authState);
          return authState;
        }),
        Provider(create: (_) => AuthService(apiClient)),
        Provider(create: (_) => ProductService(apiClient)),
        Provider(create: (_) => CustomerService(apiClient)),
        Provider(create: (_) => OrderService(apiClient)),
        Provider(create: (_) => DebtService(apiClient)),
        Provider(create: (_) => ReportsService(apiClient)),
        Provider(create: (_) => ReportsService(apiClient)),
        Provider(create: (_) => NotificationService(apiClient)),
        Provider(create: (_) => AdminService(apiClient)),
        Provider(create: (_) => InventoryService(apiClient)),
        Provider(create: (_) => AIService(apiClient)),
        ChangeNotifierProxyProvider2<AuthState, NotificationService,
            NotificationProvider>(
          create: (context) => NotificationProvider(
            context.read<NotificationService>(),
            isLoggedIn: context.read<AuthState>().isLoggedIn,
          ),
          update: (context, authState, service, previous) {
            final provider = previous ?? NotificationProvider(service);
            provider.updateAuthStatus(authState.isLoggedIn);
            return provider;
          },
        ),
        ProxyProvider<AuthState, SSEService>(
          update: (_, authState, __) => SSEService(authState),
          dispose: (_, sse) => sse.dispose(),
        ),
      ],
      child: Consumer<AuthState>(
        builder: (context, authState, child) {
          if (authState.isLoading) {
            return const MaterialApp(
              debugShowCheckedModeBanner: false,
              home: Scaffold(
                body: Center(child: CircularProgressIndicator()),
              ),
            );
          }

          return MaterialApp(
            title: 'BizFlow Mobile',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorSchemeSeed: AppColors.primary,
            ),
            home: authState.isLoggedIn
                ? const DashboardScreen()
                : const LoginScreen(),
            onGenerateRoute: (settings) {
              switch (settings.name) {
                case AppRoutes.login:
                  return MaterialPageRoute(builder: (_) => const LoginScreen());
                case '/forgot-password':
                  return MaterialPageRoute(
                      builder: (_) => const ForgotPasswordScreen());
                case AppRoutes.dashboard:
                  return MaterialPageRoute(
                      builder: (_) => const DashboardScreen());
                case AppRoutes.pos:
                  return MaterialPageRoute(
                      builder: (_) => const QuickOrderScreen());
                case AppRoutes.inventory:
                  return MaterialPageRoute(
                      builder: (_) => const InventoryScreen());
                case AppRoutes.debts:
                  return MaterialPageRoute(
                      builder: (_) => const DebtCollectionScreen());
                case '/customers':
                  return MaterialPageRoute(
                      builder: (_) => const CustomerListScreen());
                case '/orders':
                  return MaterialPageRoute(
                      builder: (_) => const OrderListScreen());
                case '/reports':
                  return MaterialPageRoute(
                      builder: (_) => const ReportsScreen());
                case '/profile':
                  return MaterialPageRoute(
                      builder: (_) => const ProfileScreen());
                case '/suppliers':
                  return MaterialPageRoute(
                      builder: (_) => const SupplierListScreen());
                case '/cashbook':
                  return MaterialPageRoute(
                      builder: (_) => const CashbookScreen());
                case '/adjustment':
                  return MaterialPageRoute(
                      builder: (_) => const InventoryAdjustmentScreen());
                case '/product-form':
                  final product = settings.arguments as Product?;
                  return MaterialPageRoute(
                      builder: (_) => ProductFormScreen(product: product));

                case AppRoutes.debtDetail:
                  final args = settings.arguments;
                  final debtId = args is int ? args : 0;
                  return MaterialPageRoute(
                    builder: (_) => DebtDetailScreen(debtId: debtId),
                  );
                case '/order-detail':
                  final args = settings.arguments;
                  final orderId = args is int ? args : 0;
                  return MaterialPageRoute(
                    builder: (_) => OrderDetailScreen(orderId: orderId),
                  );

                default:
                  return MaterialPageRoute(
                    builder: (_) => authState.isLoggedIn
                        ? const DashboardScreen()
                        : const LoginScreen(),
                  );
              }
            },
          );
        },
      ),
    );
  }
}
