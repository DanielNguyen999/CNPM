import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
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
import 'providers/notification_provider.dart';
import 'core/constants/app_routes.dart';
import 'core/constants/app_colors.dart';
import 'screens/auth/login_screen.dart';
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
        Provider(create: (_) => NotificationService(apiClient)),
        ChangeNotifierProxyProvider2<AuthState, NotificationService,
            NotificationProvider>(
          create: (context) => NotificationProvider(
            context.read<NotificationService>(),
            isLoggedIn: context.read<AuthState>().isLoggedIn,
          ),
          update: (context, authState, service, previous) {
            if (previous == null) {
              return NotificationProvider(service,
                  isLoggedIn: authState.isLoggedIn);
            }
            if (previous.isLoggedIn != authState.isLoggedIn) {
              if (authState.isLoggedIn) {
                previous.startPolling();
                previous.fetchNotifications();
              } else {
                previous.stopPolling();
              }
            }
            return previous;
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
              textTheme: GoogleFonts.interTextTheme(),
            ),
            initialRoute:
                authState.isLoggedIn ? AppRoutes.dashboard : AppRoutes.login,
            routes: {
              AppRoutes.login: (context) => const LoginScreen(),
              AppRoutes.dashboard: (context) => const DashboardScreen(),
              AppRoutes.pos: (context) => const QuickOrderScreen(),
              AppRoutes.inventory: (context) => const InventoryScreen(),
              AppRoutes.debts: (context) => const DebtCollectionScreen(),
              '/customers': (context) => const CustomerListScreen(),
              '/orders': (context) => const OrderListScreen(),
              '/reports': (context) => const ReportsScreen(),
              '/profile': (context) => const ProfileScreen(),
            },
            onGenerateRoute: (settings) {
              if (settings.name == AppRoutes.debtDetail) {
                final debtId = settings.arguments as int;
                return MaterialPageRoute(
                  builder: (context) => DebtDetailScreen(debtId: debtId),
                );
              }
              if (settings.name == '/order-detail') {
                final orderId = settings.arguments as int;
                return MaterialPageRoute(
                  builder: (context) => OrderDetailScreen(orderId: orderId),
                );
              }
              return null;
            },
          );
        },
      ),
    );
  }
}
