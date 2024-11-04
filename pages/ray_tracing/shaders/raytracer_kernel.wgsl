@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }

    let offset_x = (f32(screen_pos.x) - f32(screen_size.x) / 2);
    let offset_y = (f32(screen_pos.y) - f32(screen_size.y) / 2);
    let horizontal_coefficient: f32 = offset_x / f32(screen_size.x);
    let vertical_coefficient: f32 = offset_y / f32(screen_size.x);
    let forwards: vec3<f32> = vec3<f32>(1.0, 0.0, 0.0);
    let right: vec3<f32> = vec3<f32>(0.0, -1.0, 0.0);
    let up: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

    var myRay: Ray;
    let v = forwards + horizontal_coefficient * right + vertical_coefficient * up;
    myRay.direction = normalize(v);
    myRay.origin = vec3<f32>(0.0, 0.0, 0.0);

    let purple = vec3<f32>(0.5, 0.0, 1.0);
    var pixel_color: vec3<f32> = purple; // "background"

    let is_in_cube_point = myRay.direction + vec3<f32>(offset_x, offset_y, 0.0);
    // let is_in_cube_point = myRay.direction + vec3<f32>(f32(horizontal_coefficient), f32(vertical_coefficient), 0.0);
    if is_in_create_cube(is_in_cube_point) {
        let cyan = vec3<f32>(0.0, 1.0, 1.0);
        pixel_color = cyan;
    }

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

struct Cube {
    min_x: f32,
    max_x: f32,
    min_y: f32,
    max_y: f32,
    min_z: f32,
    max_z: f32,
}

fn is_in_create_cube(point: vec3<f32>) -> bool {
    let len = 10.0;
    let pos_z = 0.0;

    let half = len / 2.0;
    let min = -half;
    let max = half;

    var cube: Cube;
    cube.min_x = min;
    cube.max_x = max;
    cube.min_y = min;
    cube.max_y = max;
    cube.min_z = min + pos_z;
    cube.max_z = max + pos_z;

    let point2 = point * 0.08;
    return is_in_cube(point2, cube);
}

fn is_in_cube(point: vec3<f32>, cube: Cube) -> bool {
    if point.x >= cube.min_x && point.y >= cube.min_y && point.z >= cube.min_z && point.x <= cube.max_x && point.y <= cube.max_y && point.z <= cube.max_z {
        return true;
    } else {
        return false;
    }
}
