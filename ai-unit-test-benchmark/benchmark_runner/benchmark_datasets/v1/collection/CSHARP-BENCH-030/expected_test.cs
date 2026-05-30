public class ProductServiceTests
{
    [Fact]
    public void SortByPrice_ShouldReturnProductsSortedByPrice()
    {
        var products = new List<Product>
        {
            new Product { Name = "Keyboard", Price = 300 },
            new Product { Name = "Mouse", Price = 100 },
            new Product { Name = "Monitor", Price = 500 }
        };

        var service = new ProductService();

        var result = service.SortByPrice(products);

        Assert.Equal(100, result[0].Price);
        Assert.Equal(300, result[1].Price);
        Assert.Equal(500, result[2].Price);
    }
}