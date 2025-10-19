-- Complex SQL Queries with CTEs and Window Functions
-- Demonstrates advanced query patterns for analytics

-- Common Table Expressions (CTEs) for readability
WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', order_date) AS month,
    customer_id,
    SUM(total_amount) AS total_spent,
    COUNT(*) AS order_count
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY DATE_TRUNC('month', order_date), customer_id
),

customer_metrics AS (
  SELECT
    customer_id,
    AVG(total_spent) AS avg_monthly_spend,
    SUM(total_spent) AS total_lifetime_value,
    SUM(order_count) AS total_orders
  FROM monthly_sales
  GROUP BY customer_id
)

SELECT
  c.customer_id,
  c.name,
  c.email,
  cm.avg_monthly_spend,
  cm.total_lifetime_value,
  cm.total_orders,
  CASE
    WHEN cm.total_lifetime_value > 10000 THEN 'VIP'
    WHEN cm.total_lifetime_value > 5000 THEN 'Premium'
    WHEN cm.total_lifetime_value > 1000 THEN 'Standard'
    ELSE 'New'
  END AS customer_tier
FROM customers c
INNER JOIN customer_metrics cm ON c.customer_id = cm.customer_id
ORDER BY cm.total_lifetime_value DESC
LIMIT 100;

-- Window functions for running totals and rankings
SELECT
  order_id,
  customer_id,
  order_date,
  total_amount,
  SUM(total_amount) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  ROW_NUMBER() OVER (
    PARTITION BY customer_id
    ORDER BY total_amount DESC
  ) AS purchase_rank,
  LAG(total_amount, 1) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS previous_order_amount,
  total_amount - LAG(total_amount, 1) OVER (
    PARTITION BY customer_id
    ORDER BY order_date
  ) AS amount_diff_from_previous
FROM orders
WHERE order_date >= '2024-01-01'
ORDER BY customer_id, order_date;

-- Recursive CTE for hierarchical data
WITH RECURSIVE employee_hierarchy AS (
  SELECT
    employee_id,
    name,
    manager_id,
    1 AS level,
    name AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT
    e.employee_id,
    e.name,
    e.manager_id,
    eh.level + 1,
    eh.path || ' > ' || e.name
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)

SELECT
  employee_id,
  name,
  level,
  path,
  REPEAT('  ', level - 1) || name AS indented_name
FROM employee_hierarchy
ORDER BY path;

-- Complex aggregation with FILTER clause
SELECT
  product_category,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
  AVG(total_amount) AS avg_order_value,
  AVG(total_amount) FILTER (WHERE status = 'completed') AS avg_completed_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_amount) AS median_order_value
FROM orders o
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY product_category
HAVING COUNT(*) >= 10
ORDER BY total_orders DESC;
