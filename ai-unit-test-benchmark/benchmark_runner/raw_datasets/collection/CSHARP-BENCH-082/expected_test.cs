public class UserServiceTests
{
    [Fact]
    public void GetActiveUsers_ShouldReturnOnlyActiveUsers()
    {
        var users = new List<User>
        {
            new User { Name = "John", IsActive = true },
            new User { Name = "Jane", IsActive = false },
            new User { Name = "Bob", IsActive = true }
        };

        var service = new UserService();

        var result = service.GetActiveUsers(users);

        Assert.Equal(2, result.Count);
        Assert.All(result, x => Assert.True(x.IsActive));
    }
}