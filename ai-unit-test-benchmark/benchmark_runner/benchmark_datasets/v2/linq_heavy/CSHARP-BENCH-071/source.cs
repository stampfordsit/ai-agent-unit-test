public class Product
{
    public decimal Price { get; set; }
}

public class ProductService
{
    public decimal GetTotalPrice(List<Product> products)
    {
        return products.Aggregate(
            0m,
            (sum, p) => sum + p.Price);
    }
}