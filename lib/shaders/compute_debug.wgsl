@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> movement: Movement;
@group(0) @binding(2) var<uniform> rotation: Rotation;
@group(0) @binding(3) var<uniform> pars: Pars;
@group(0) @binding(4) var<uniform> transformation_buffer: mat4x4f;

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

struct Movement {
    view: vec3<f32>,
}
struct Rotation {
    rot: mat4x4<f32>,
}
struct Pars {
    pars: vec3<f32>,
}

@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }

    // screen coords -> [-0.5 .. 0.5]
    let offset_x = (f32(screen_pos.x) - f32(screen_size.x) / 2.);
    let offset_y = (f32(screen_pos.y) - f32(screen_size.y) / 2.);
    let horizontal_coefficient: f32 = offset_x / f32(screen_size.x);
    let vertical_coefficient: f32 = offset_y / f32(screen_size.x);

    // 3d span
    let forwards: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);
    let right: vec3<f32> = vec3<f32>(1.0, 0.0, 0.0);
    let up: vec3<f32> = vec3<f32>(0.0, 1.0, 0.0);

    // vector goes from screen inwards (opposite to observer), by `forwards` length
    var myRay: Ray;
    let v = forwards + horizontal_coefficient * right + vertical_coefficient * up;
    myRay.direction = normalize(v);
    // vector starts at pixel
    myRay.origin = horizontal_coefficient * right + vertical_coefficient * up;

    let background = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    var pixel_color: vec4<f32> = background;

    var mov = movement.view;

    let internal_scaling_factor = 10.0;
    myRay.direction *= internal_scaling_factor;

    // // move
    // myRay.direction.z += mov.z;
    // myRay.direction.y += mov.y;
    // myRay.direction.x += mov.x;

    // // move cube so it's centered at origin, rotate and move back
    // let init_center_offset = vec3<f32>(0.0, 0.0, internal_scaling_factor);
    // let to_rotate = myRay.direction - mov - init_center_offset;
    // let rotated_4 = rotation.rot * vec4<f32>(to_rotate, 1.0);
    // var rotated_3 = vec3<f32>(rotated_4.x, rotated_4.y, rotated_4.z);
    // rotated_3 = rotated_3 + mov + init_center_offset;

    // // step back a little, to have a better view
    // // rotated_3.z -= internal_scaling_factor; 
    // // rotated_3.z -= 1000000000.; 

    let transformed_4 = transformation_buffer * vec4<f32>(myRay.direction, 1.0);
    let transformed_3 = vec3<f32>(transformed_4.x, transformed_4.y, transformed_4.z);

    let value = my_fn(transformed_3);
    // let value = my_fn(rotated_3);

    if value == 1. {
        pixel_color = vec4<f32>(1.0, 0., 0., 1.);
    } 
    
    textureStore(color_buffer, screen_pos, pixel_color);
}

fn my_fn(coords: vec3<f32>) -> f32 {
    if coords.x >= -0.1 && coords.x <= 0.1 && coords.y >= -0.1 && coords.y <= 0.1 && coords.z >= -0.1 && coords.z <= 0.1 {
    // if coords.x >= -0.1 && coords.x <= 0.1 && coords.y >= -0.1 && coords.y <= 0.1 && coords.z >= -0.1 && coords.z <= 10.0 {
        return 1.0;
    } else {
        return 0.0;
    }
}
