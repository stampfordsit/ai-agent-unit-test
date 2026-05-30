public class Product
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
}

public class ProductService
{
    public List<Product> SortByPrice(List<Product> products)
    {
        return products
            .OrderBy(x => x.Price)
            .ToList();
    }
}